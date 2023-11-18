import '../node_modules/jquery/dist/jquery.min.js';
import '../node_modules/axios/dist/axios.js';
import '../node_modules/chart.js/dist/chart.umd.js';
import debounce from './helpers/debounce.js';

const appContainer = $("#AppContainer");

const c= $('<canvas id="graph"></canvas>');

let header = $('<header></header>')
appContainer.append(header)

const displaySearchSection = () => {

    const searchSection = $("<section id='search-section'></section>")
    const searchTitle = $("<h2 class='fw-bold'>Search for a coin</h2>")
    const searchInput = $("<input type='text' class='container-fluid rounded fs-2'></input>"); 
    const trendingTitle = $("<h2 class='fw-bold'>Trending coins</h2>")


    searchTitle.appendTo(searchSection)
    searchInput.appendTo(searchSection)
    searchInput.on('input', homeStore.setQuery)
    trendingTitle.appendTo(searchSection)

    searchSection.appendTo(appContainer)

    homeStore.updateLinks()
}
// make a new div called wrapper, sum the strings and change html()
// the wrapper will be a row, making elements have max width
// grid should be used to align the header.

// Everything aligned to center
// Details: The name to detail must be in flex same font size, different font weight, with border bottom 


const homeStore = {

    storedCoins : [],
    query: '',
    trending:[],
    graphData:[],
    data:[],

    //UI
    linksCoins: [],

    fetchCoins : async ()=>{
    const [res, btcRes] = await Promise.all(
        [
            axios.get('https://api.coingecko.com/api/v3/search/trending'),
            axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        ]
    )

    const btcPrice = btcRes.data.bitcoin.usd;
    
    
    const coins = res.data.coins.map(coin => {
        const item = coin.item
        return {
        name: item.name,
        image:  item.large,
        id: item.id,
        priceBtc : coin.item.price_btc.toFixed(10),
        priceUsd : (coin.item.price_btc * btcPrice).toFixed(10)
    }
    })
    console.log(coins)
    homeStore.storedCoins = coins;
    homeStore.trending = coins;
    homeStore.updateLinks()
    },

    setQuery : (e)=>{
        homeStore.query = e.target.value;
        console.log(homeStore.query)
        homeStore.searchCoins();
    },

    searchCoins: debounce(async ()=>{
        const query = homeStore.query;
        if( query.length > 2){

            const res = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`)
            console.log(res.data)

        const coins = res.data.coins.map(coin => {
            return {
                name:coin.name,
                image:coin.large,
                id:coin.id
            }
        })
        
        homeStore.storedCoins = coins;
    } else {
        homeStore.storedCoins = homeStore.trending;
    }

    homeStore.updateLinks()
    }, 500),

    //UI
    createLinkCoins : () => {
        homeStore.linksCoins = homeStore.storedCoins.map(
        coin => {
            const coinLink =$("<div class='border-top search-result'></div>")
            const coinInfo = `<img src='${coin.image}' />
            <a href='#${coin.id}'>${coin.name}</a>`;
            
            coinLink.append(coinInfo);
            
            if (!coin.priceBtc){
                return coinLink
            } else{
                const coinConversion = `<i class="fa-brands fa-bitcoin" style="color: #ff8000;"></i> 
                ${coin.priceBtc} ${coin.priceUsd}`
                coinLink.append(coinConversion)
                return coinLink
            }
        }
    )
    },
    updateLinks : () =>{
        $('.search-result').remove();
        homeStore.createLinkCoins();
        //trending coins or search results
        $('#search-section').append(homeStore.linksCoins);
    }

}

homeStore.fetchCoins();
    
    const fetchMarket = async (id) => {
            const [graphRes, dataRes] = await Promise.all([
                axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`),
                axios.get(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&market_data=true`),
            ])

            

           console.log(graphRes.data)
           console.log(dataRes.data)
           
           homeStore.graphData = graphRes.data.prices.map(price => {
               const [date, p] = price;
               const formatedDate = new Date(date).toLocaleDateString("en-us");

               return { 
                date: formatedDate, 
                price: p }
            }
            )
            homeStore.data = dataRes.data;
            console.log(homeStore.graphData)      
            displayCoinData();
    }

const HashChange= () => {

    let hash = window.location.hash;
    console.log(hash)        
    $('#search-section').remove()
    if( hash.startsWith("#") && hash.length>2 ){
        hash = hash.replace( "#" , "" );
        console.log(hash)
        
        header.html('<h1 class="py-3 bg-dark text-light text-center text-uppercase fs-2 fw-bold"><a href="#"><i class="fa-solid fa-angle-left"></i></a>Coiner!</h1>')
        fetchMarket(hash)
        
    } else {
        $('#coin-info').remove()
        header.html('<h1 class="py-3 bg-dark text-light text-center text-uppercase fs-2 fw-bold">Coiner!</h1>')
        displaySearchSection()
    }
    console.log(homeStore.linksCoins)
}

window.onhashchange = HashChange;
HashChange();



let chart;

const displayGraph = async () => {
    const data = homeStore.graphData;
    if (chart) {
    chart.destroy()
    }
     chart = new Chart(
      c,
      {
        type: 'line',
        
        data: {
          labels: data.map(row => row.date),
          datasets: [
            {
              label: 'Price',
              data: data.map(row => row.price),
              fill: 'origin',
              lineTension: 0.4
            },
          ]
        },
        options: {
            plugins: {
                filler: {
                    propagate: true
                }
            }
        }
      }
    );

};

const displayCoinData = () => {
    $('#coin-info').remove();

    const {data} = homeStore;
    console.log(data)
    appContainer.append(c);
    displayGraph()

    const coinWrapper = $('<section id="coin-info"></section>')
    
    const coinTitle = $(`<div id="coin-title">
    <h2>${data.name} ${data.symbol}</h2>
    <img src=${data.image.large} />
    </div>`);

    const coinData = $(`<div id="coin-details">
    <div>
        <h4>Market cap rank</h4>
        <span>${data.market_data.market_cap_rank}</span>
    </div>
    <div>
        <h4>24h high</h4>
        <span>${data.market_data.high_24h.usd}</span>
    </div>
    <div>
        <h4>24h low</h4>
        <span>${data.market_data.low_24h.usd}</span>
    </div>
    <div>
        <h4>Circulating supply</h4>
        <span>${data.market_data.circulating_supply}</span>
    </div>
    <div>
        <h4>Current price</h4>
        <span>${data.market_data.current_price.usd}</span>
    </div>
    <div>
        <h4>1y change</h4>
        <span>${data.market_data.price_change_percentage_1y.toFixed(2)}%</span>
    </div> 
    </div>`)

    coinWrapper.appendTo(appContainer)
    coinTitle.appendTo(coinWrapper)
    c.appendTo(coinWrapper)
    coinData.appendTo(coinWrapper)
}
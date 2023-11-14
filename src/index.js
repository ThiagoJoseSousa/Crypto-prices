// import axios from "https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/esm/axios.min.js";

// const sharingTest= (axios.get('https://api.coingecko.com/api/v3/search/trending'))
// //export default sharingTest;
import '../node_modules/jquery/dist/jquery.min.js';
import '../node_modules/axios/dist/axios.js';
import "../node_modules/chart.js/dist/chart.umd.js";
import debounce from './helpers/debounce.js';

const appContainer = $("#AppContainer");


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
        priceBtc : coin.item.price_btc,
        priceUsd : (coin.item.price_btc * btcPrice).toFixed(10)
    }
    })
    console.log(coins)
    homeStore.storedCoins = coins;
    homeStore.trending = coins;
    homeStore.updateUI()
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

    homeStore.updateUI()
    }, 500),

    //UI
    createLinkCoins : () => {
        homeStore.linksCoins = homeStore.storedCoins.map(
        coin => {
            return `<a href='#${coin.id}'>${coin.name}</a>`
        }
    )
    },
    updateUI : () =>{
        $('a').remove();
        homeStore.createLinkCoins();
        appContainer.append(homeStore.linksCoins);
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
            displayGraph()
            displayHeader();
    }

const HashChange= () => {

    let hash = window.location.hash;
    console.log(hash)
    if( hash.startsWith("#") && hash.length>2 ){
        hash = hash.replace( "#" , "" );
        console.log(hash)
        


        fetchMarket(hash)
        
    }
    console.log(homeStore.linksCoins)
}

window.onhashchange = HashChange;
HashChange();

const t = $("<input type='text'></input>");
t.on('input', homeStore.setQuery)
appContainer.append(t)

const c= $('<canvas id="acquisitions"></canvas>');
appContainer.append(c);

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

const displayHeader = async () => {
    $('header').remove();
    $('#coin-details').remove();
    const {data} = homeStore;
    console.log(data)
    const header = `<header>
    <h2>${data.name} ${data.symbol}</h2>
    <img src=${data.image.large} />
    </header>
    <div id="coin-details">
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
    </div>
    `
    appContainer.append(header)
}
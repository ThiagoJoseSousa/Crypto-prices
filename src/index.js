import $ from 'jquery';
import axios from 'axios';
import Chart from 'chart.js/auto';
import debounce from './helpers/debounce.js';

const appContainer = $("#AppContainer");

const c= $('<canvas id="graph" class="m-4"></canvas>');

let header = $('<header class="bg-dark"></header>')
appContainer.append(header)


const displaySearchSection = () => {
    const responsiveContainer = $('<div class="container"></div>');
    const rowContainer = $('<div class="row"></div>')

    const searchSection = $("<section id='search-section' class='col-md-8 col-xxl-12 m-auto text-center'></section>")
    const searchTitle = $("<h2 class='fw-bold fs-3 mt-5'>Search for a coin</h2>")
    const searchInput = $("<input type='text' class='container-fluid rounded fs-3 text-center'></input>"); 
    const trendingTitle = $("<h2 class='fw-bold fs-3 mt-5 mb-4'>Trending coins</h2>");


    searchTitle.appendTo(searchSection)
    searchInput.appendTo(searchSection)
    searchInput.on('input', homeStore.setQuery)
    trendingTitle.appendTo(searchSection)

    searchSection.appendTo(rowContainer);
    
    rowContainer.appendTo(responsiveContainer)
    
    responsiveContainer.appendTo(appContainer)
    
    homeStore.updateLinks()
}

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
        priceUsd : (coin.item.price_btc * btcPrice).toFixed(4)
    }
    })

    homeStore.storedCoins = coins;
    homeStore.trending = coins;
    homeStore.updateLinks()
    },

    setQuery : (e)=>{
        homeStore.query = e.target.value;
        homeStore.searchCoins();
    },

    searchCoins: debounce(async ()=>{
        const query = homeStore.query;
        if( query.length > 2){

            const res = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`)

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
            const coinLink =$("<div class='border-bottom search-result d-flex align-items-center flex-column flex-sm-row text-start'></div>")
            const coinInfo = `<img src='${coin.image}' class="py-4 px-4" width='100px' height='100px'/>
            <a href='#${coin.id}' class='d-block me-sm-auto text-reset text-decoration-none fs-4 text-sm-start text-center'>${coin.name}</a>`;
            
            coinLink.append(coinInfo);
            
            if (!coin.priceBtc){
                return coinLink
            } else{
                const coinConversion = `<div><div class="fs-5" style="white-space:nowrap"><i class="fa-brands fa-bitcoin fs-5" style="color: #ff8000;"></i> 
                ${coin.priceBtc}</div> <div  class="text-center text-sm-end"><span class="fs-6 fw-lighter">(${coin.priceUsd} USD)</div>`
                coinLink.append(coinConversion)
                return coinLink
            }
        }
    )
    },
    updateLinks : () =>{
        $('.search-result').remove();
        homeStore.createLinkCoins();
        $('#search-section').append(homeStore.linksCoins);

    }

}

homeStore.fetchCoins();
    
    const fetchMarket = async (id) => {
            const [graphRes, dataRes] = await Promise.all([
                axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`),
                axios.get(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&market_data=true`),
            ])

           homeStore.graphData = graphRes.data.prices.map(price => {
               const [date, p] = price;
               const formatedDate = new Date(date).toLocaleDateString("en-us");

               return { 
                date: formatedDate, 
                price: p }
            }
            )
            homeStore.data = dataRes.data;   
            displayCoinData();
    }

const HashChange= () => {

    let hash = window.location.hash;
       
    $('.container').remove()
    if( hash.startsWith("#") && hash.length>2 ){
        hash = hash.replace( "#" , "" );
        
        header.html('<div class="container"><div class="col-sm-8 col-xxl-12 mx-auto position-relative"><h1 class="py-3 text-light text-uppercase fs-2 fw-bold row"> <a href="#" class="text-reset col-sm-8 col-xxl-12 position-absolute start-0 text-start"><i class="fa-solid fa-angle-left "></i></a><span class="text-center fs-3">Coiner!</span></h1></div></div>')
        fetchMarket(hash)
        
    } else {
        header.html('<h1 class="py-3 text-light text-center text-uppercase fs-3 fw-bold">Coiner!</h1>')
        displaySearchSection()
    }
}

window.onhashchange = HashChange;
HashChange();



let chart;

const displayGraph = async () => {
    const data = homeStore.graphData;
    const skipData= Math.floor(data.length/10);
    let filteredData=[];
    for (let i=0; i<data.length-1; i+=skipData){
        filteredData.push(data[i]);
    }

    if (chart) {
    chart.destroy()
    }
     chart = new Chart(
      c,
      {
        type: 'line',
        
        data: {
          labels: filteredData.map(row => row.date),
          datasets: [
            {
              label: 'USD',            
              data: filteredData.map(row => row.price),
              fill: 'origin',
              lineTension: 0.5,
              pointHitRadius: 30,
              backgroundColor:'rgba(221,232,179,0.5)',
              borderColor:'rgba(89,140,88 ,1)'
            },
          ]
        },
        options: {
            plugins: {
                filler: {
                    propagate: true
                }
            },
            scales: {
                y: {
                  ticks: {
                    font: {
                      size: 12,
                    }
                  }
                },
                x: {
                    ticks: {
                      font: {
                        size: 12,
                      }
                    }
                  }
              },
        }
      }
    );

};

const displayCoinData = () => {
    $('#coin-info').remove();

    const {data} = homeStore;

    const responsiveContainer = $('<div class="container"></div>');
    const rowContainer = $('<div class="row"></div>')

    const coinWrapper = $('<section id="coin-info" class="col-sm-8 col-xxl-12 m-auto"></section>')
    
    const coinTitle = $(`<div id="coin-title" class="text-center ">
    <img src=${data.image.large} class="py-4 px-4 mt-4" width = '125px' height='125px'/>
    <h2 class="fw-bold fs-3">${data.name} <span class="text-uppercase">(${data.symbol})<span/></h2>
    </div>`);

    const coinData = $(`<div id="coin-details">
    <h2 class="fw-bold fs-3 text-center my-4">Details</h2>
    <div class="d-flex justify-content-sm-between flex-column flex-sm-row align-items-center border-bottom py-3">
        <h4 class="fs-5 fw-bold mb-0">Market cap rank</h4>
        <span class="fs-5">$${data.market_data.market_cap_rank}</span>
    </div>
    <div class="d-flex justify-content-sm-between flex-column flex-sm-row align-items-center border-bottom py-3">
        <h4 class="fs-5 fw-bold mb-0">24h high</h4>
        <span class="fs-5">$${data.market_data.high_24h.usd}</span>
    </div>
    <div class="d-flex justify-content-sm-between flex-column flex-sm-row align-items-center border-bottom py-3">
        <h4 class="fs-5 fw-bold mb-0">24h low</h4>
        <span class="fs-5">$${data.market_data.low_24h.usd}</span>
    </div>
    <div class="d-flex justify-content-sm-between flex-column flex-sm-row align-items-center border-bottom py-3">
        <h4 class="fs-5 fw-bold mb-0">Circulating supply</h4>
        <span class="fs-5">$${data.market_data.circulating_supply}</span>
    </div>
    <div class="d-flex justify-content-sm-between flex-column flex-sm-row align-items-center border-bottom py-3">
        <h4 class="fs-5 fw-bold mb-0">Current price</h4>
        <span class="fs-5">$${data.market_data.current_price.usd}</span>
    </div>
    <div class="d-flex justify-content-sm-between flex-column flex-sm-row align-items-center border-bottom py-3">
        <h4 class="fs-5 fw-bold mb-0">1y change</h4>
        <span class="fs-5">${data.market_data.price_change_percentage_1y.toFixed(2)}%</span>
    </div> 
    </div>`)

    responsiveContainer.appendTo(appContainer)
    rowContainer.appendTo(responsiveContainer)
    coinWrapper.appendTo(rowContainer)
    coinTitle.appendTo(coinWrapper)
    c.appendTo(coinWrapper)
    displayGraph()
    coinData.appendTo(coinWrapper)
}
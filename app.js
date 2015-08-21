var express = require('express')
	,app = express()
	,web3 = require('web3')
	,path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

if(!web3.currentProvider)
    web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

var lottoAbi = [{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getTickets","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getPot","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"getIsCashed","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getSubpotsCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"calculateWinner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"getRoundIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"blockIndex","type":"uint256"}],"name":"getHashOfBlock","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getBlocksPerRound","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getTicketPrice","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getSubpot","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"cash","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"getDecisionBlockNumber","outputs":[{"name":"","type":"uint256"}],"type":"function"}]
	,Lotto = web3.eth.contract(lottoAbi).at('0xdf415bb7ae2363ecbb6a595f07cbc2fc0fd417d3')

app.get('/', function (req, res) {
	var filePath = path.join(__dirname, '/views/index.html')
	res.sendFile(filePath);
})

app.get('/api/lotto',function(req, res){

	var roundIndex = req.params.roundIndex
		,round = {
			roundIndex:Lotto.getRoundIndex()
			,blocksPerRound:Lotto.getBlocksPerRound()
			,ticketPrice:Lotto.getTicketPrice()
			,blockNumber:web3.eth.blockNumber
		}

	res.send(round)
})


app.get('/api/rounds/:roundIndex',function(req, res){

	var roundIndex = req.params.roundIndex
		,round = {
			pot:Lotto.getPot(roundIndex)
			,tickets:Lotto.getTickets(roundIndex)
			,subpot:Lotto.getSubpot(roundIndex)
			,subpotsCount:Lotto.getSubpotsCount(roundIndex)
			,subpots:[]
		}

	for(var subpotIndex = 0; subpotIndex<round.subpotsCount; subpotIndex++){

		var decisionBlockNumber = Lotto.getDecisionBlockNumber(roundIndex,subpotIndex)
			,decisionBlock = web3.eth.getBlock(decisionBlockNumber)

		round.subpots.push({
			decisionBlockNumber:decisionBlockNumber
			,decisionBlockHash:decisionBlock?decisionBlock.hash:null
			,winner:decisionBlock?Lotto.calculateWinner(roundIndex,subpotIndex):null
			,isCashed:Lotto.getIsCashed(roundIndex,subpotIndex)
		})
	}

	res.send(round)
})

app.listen(3000)
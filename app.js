var express = require('express')
	,app = express()
	,web3 = require('web3')
	,path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

if(!web3.currentProvider)
    web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

var lottoAbi = [{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getTickets","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getPot","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"getIsCashed","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getSubpotsCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"calculateWinner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"getRoundIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"blockIndex","type":"uint256"}],"name":"getHashOfBlock","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getBlocksPerRound","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getTicketPrice","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getSubpot","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"cash","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"getDecisionBlockNumber","outputs":[{"name":"","type":"uint256"}],"type":"function"}]
	,Lotto = web3.eth.contract(lottoAbi).at('0xdf415bb7ae2363ecbb6a595f07cbc2fc0fd417d3')
	,blocksPerRound = 6800

app.get('/', function (req, res) {
	var filePath = path.join(__dirname, '/views/index.html')
	res.sendFile(filePath);
})

app.get('/api/lotto',function(req, res){

	var batch = web3.createBatch()
	var lotto = {blocksPerRound:blocksPerRound}

	batch.add(Lotto.getRoundIndex.request(function(error,roundIndex){
		lotto.roundIndex = parseInt(roundIndex)
	}))
	batch.add(Lotto.getTicketPrice.request(function(error,ticketPrice){
		lotto.ticketPrice = ticketPrice
	}))
	batch.add(web3.eth.getBlockNumber.request(function(results,blockNumber){
		lotto.blockNumber = parseInt(blockNumber)
		res.send(lotto);
	}))

	batch.execute()

})


app.get('/api/rounds/:roundIndex',function(req, res){

	var batch = web3.createBatch()
	var round = {subpots:[]}
	var roundIndex = req.params.roundIndex
	var blockNumber

	batch.add(web3.eth.getBlockNumber.request(function(results,blockNumber){
		blockNumber = parseInt(blockNumber)
	}))
	

	batch.add(Lotto.getSubpotsCount.request(roundIndex,function(results,subpotsCount){

		round.subpotsCount = parseInt(subpotsCount)


		var batch = web3.createBatch()

		for(var subpotIndex = 0; subpotIndex<round.subpotsCount; subpotIndex++){

			var decisionBlockNumber = (roundIndex*blocksPerRound)+subpotIndex
			var _subpotIndex = subpotIndex

			round.subpots[subpotIndex]={decisionBlockNumber:decisionBlockNumber}

			if(blockNumber>decisionBlockNumber){
				round.subpots[subpotIndex].decisionBlockHash=null
				round.subpots[subpotIndex].winner = null
				round.subpots[subpotIndex].isCashed = null
				continue;
			}

			(function(subpotIndex){
				batch.add(web3.eth.getBlock.request(decisionBlockNumber,function(error,block){
					round.subpots[subpotIndex].decisionBlockHash = 1;
					round.subpots[subpotIndex].decisionBlockHash = block.hash
				}))

				batch.add(Lotto.calculateWinner.request(roundIndex,subpotIndex,function(error,winner){
					round.subpots[subpotIndex].winner = winner
				}))

				batch.add(Lotto.getIsCashed.request(roundIndex,subpotIndex,function(error,isCashed){
					round.subpots[subpotIndex].isCashed = isCashed
				}))
			}(subpotIndex))
		
		}

		batch.add(Lotto.getPot.request(roundIndex,function(error,pot){
			round.pot = parseInt(pot)
		}))
		batch.add(Lotto.getTickets.request(roundIndex,function(error,tickets){
			round.tickets = tickets
		}))
		batch.add(Lotto.getSubpot.request(roundIndex,function(error,subpot){
			round.subpot = subpot
			res.send(round);
		}))

		batch.execute()
	
	}))

	batch.execute()

})

app.listen(3000)
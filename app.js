var express = require('express')
	,app = express()
	,web3 = require('web3')
	,path = require('path')
	,cors = require('cors')

app.use(cors());

app.get('/api/lotto',function(req, res){

	try{

		if(!web3.currentProvider)
	    web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

		var LottoAbi = [{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getPot","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"buyer","type":"address"}],"name":"getTicketsCountByBuyer","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"getIsCashed","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"buyer","type":"address"}],"name":"getBuyers","outputs":[{"name":"","type":"address[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getSubpotsCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"calculateWinner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"getRoundIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"blockIndex","type":"uint256"}],"name":"getHashOfBlock","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getBlocksPerRound","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getTicketPrice","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"}],"name":"getSubpot","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"cash","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"roundIndex","type":"uint256"},{"name":"subpotIndex","type":"uint256"}],"name":"getDecisionBlockNumber","outputs":[{"name":"","type":"uint256"}],"type":"function"}];LottoContract = web3.eth.contract(LottoAbi);Lotto = LottoContract.at('0x96268285750b282830797f2c43d6ef941cb78596')
			,Lotto = web3.eth.contract(LottoAbi).at('0x539f2912831125c9b86451420bc0d37b219587f9')
		 	,blocksPerRound = 6800
			,batch = web3.createBatch()
			,lotto = {blocksPerRound:blocksPerRound}

		batch.add(Lotto.getRoundIndex.request(function(error,roundIndex){

			batch.add(web3.eth.getBlockNumber.request(function(error,blockNumber){
				lotto.blockNumber = blockNumber
			}))
		
			batch.add(Lotto.getPot.request(roundIndex,function(error,pot){
				lotto.pot = pot
			}))

			batch.add(Lotto.getSubpotsCount.request(roundIndex,function(error,subpotsCount){
				lotto.subpotsCount = subpotsCount
			}))

			batch.add(Lotto.getSubpot.request(roundIndex,function(error,subpot){
				lotto.subpot = subpot
			}))

			batch.add(Lotto.getBuyers.request(roundIndex,function(error,buyers){
				if(error){
					res.status(400);
					res.send(error.message);
				}

				lotto.buyers = buyers
				res.json(lotto)
			}))

			batch.execute()

		}))

		batch.execute()

	}catch(e){
		res.status(400);
		res.send(e.getMessage());
	}

})

app.listen(3000)
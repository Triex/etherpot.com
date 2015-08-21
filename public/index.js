var app = angular.module('app',['ui.bootstrap'])

app.run(function($rootScope,$interval,$http){

	var averageBlockTime = 12.7;

	$rootScope.tab = 'tickets'
	$rootScope.isLoading = true

	function updateLotto(){
		return $http.get('api/lotto/').success(function(lotto){
			$rootScope.lotto = lotto
			$rootScope.blocksLeft = lotto.blocksPerRound-((lotto.blockNumber)%parseInt(lotto.blocksPerRound))
			
			var secondsLeft = $rootScope.blocksLeft*averageBlockTime;
			
			$rootScope.timeLeft = {
				hours: Math.floor(secondsLeft/(60*60))
				,minutes: Math.floor(secondsLeft/(60))
				,seconds: Math.floor(secondsLeft%60)
			}
		})
	}

	function updateRound(){
		if(!$rootScope.roundIndex) return

		return $http.get('api/rounds/'+$rootScope.roundIndex).success(function(round){
			$rootScope.round = round

			$rootScope.round.ticketsByAddress = {}

			$rootScope.round.tickets.forEach(function(ticket){
				if(!$rootScope.round.ticketsByAddress[ticket])
					$rootScope.round.ticketsByAddress[ticket]=1
				else
					$rootScope.round.ticketsByAddress[ticket]++
			})
		})
	}

	updateLotto().success(function(){
		$rootScope.roundIndex = parseInt($rootScope.lotto.roundIndex)
	}).then(updateRound).then(function(){
		$rootScope.isLoading = false
	})


	$rootScope.$watch('roundIndex',function(roundIndex){
		if(!roundIndex) return;

		$rootScope.isLoading = true
		updateRound().then(function(){
			$rootScope.isLoading = false
		})
	})


	$interval(function(){
		updateLotto().then(updateRound)
	},5000)

})
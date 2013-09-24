function TwittlerApp () {

	var twittler, tweetTemplate, usersTemplate, msgTemplate, signedIn = false;

	this.start = (function () {
		return function () {
			tweetTemplate = Handlebars.compile( $( '.tweet-template' ).html() );
			usersTemplate = Handlebars.compile( $( '.users-template' ).html() );
			msgTemplate = Handlebars.compile( $( '.message-template' ).html() );
			twittler = new Twittler();
			_.bind( displayTweets, this );
			_.bind( displayUsers, this );
			displayTweets( [] );
			displayUsers();
			twittler.start( displayTweets );
		}
	})();

	this.follow = function ( username ) {
		return twittler.follow( username );
	}

	this.unFollow = function ( username ) {
		return twittler.unFollow( username );
	}

	this.tweet = function ( message ) {
		twittler.tweet( message );
	}

	this.stop = function () {
		twittler.stop();
	}

	this.setUser = function ( username ) {
		twittler.setUser( username );
		signedIn = true;
	}

	function displayTweets ( tweets ) {
		$( '.tweet-template' ).html( tweetTemplate( tweets.reverse() ) );
		displayUsers();
	}

	function displayUsers () {
		$( '.users-template' ).html( usersTemplate( twittler.getUsers() ) );
		var numFollowed = _.filter( twittler.getFollowedUsers(),function ( user ) {
			return user !== window.visitor;
		} ).length;
		$( '.message-template' ).html( msgTemplate( {
			                                            text:'You are following ' + numFollowed + ' user' +
			                                                 ((numFollowed > 1) ? 's' : '') } ) );
	}

	/*** Twittler ***/
	function Twittler () {
		var pollInterval = 1000, pollingTimer, followedUsers = [], tweetCallback = [];

		/*** Internal functions and interface to data_generator ***/
		function makePrettyDate ( date ) {
			var diffInSeconds = Math.floor( ( Date.now() - Date.parse( date ) ) / 1000 ), dateArray = [
			], diffInMins, diffInHrs;

			if ( diffInSeconds % 60 === diffInSeconds ) {
				//return diffInSeconds + ' second' + ((diffInSeconds > 1)? 's' : '') + ' ago...';
				return 'seconds ago...';
			} else {
				if ( diffInSeconds % 3600 === diffInSeconds ) {
					diffInMins = Math.floor( diffInSeconds / 60 );
					//diffInSeconds = diffInSeconds % 60;
					dateArray.push( diffInMins + ' min' + (diffInMins > 1 ? 's' : '') + ' ago...' );
					//dateArray.push(
					//	diffInSeconds > 0 ? (diffInSeconds + ' second' + (diffInSeconds > 1 ? 's ago...' : ' ago...')) :
					//	' ago...' );
					return dateArray.join( ' ' );
				} else {
					if ( diffInSeconds % (3600 * 24) === diffInSeconds ) {
						diffInHrs = Math.floor( diffInSeconds / 3600 );
						diffInMins = Math.floor( (diffInSeconds - 3600 * diffInHrs) / 60 );
						dateArray.push( diffInHrs + ' hour' + (diffInHrs > 1 ? 's' : '') );
						dateArray.push(
							diffInMins > 0 ? (diffInMins + ' min' + (diffInMins > 1 ? 's ago...' : ' ago...')) :
							'ago...' );
						return dateArray.join( ' ' );
					}
				}
			}
			return 'More than a day ago...';
		}

		/*** Twittler API  ***/
		function start ( callback ) {
			tweetCallback.push( callback );
			pollingTimer = setInterval( getTweets, pollInterval );
		}

		function setUser ( username ) {

			if ( window.visitor && window.visitor === username ) {
				return
			}
			//if ( window.visitor ) {
			window.users = Object.keys( streams.users );
			if ( window.users.indexOf( username ) > -1 ) {
				window.users.splice( window.users.indexOf( username ), 1 );
				unFollow( window.visitor );
			}
			//}
			window.visitor = username;
			streams.users[username] = [];
			follow( username );

		}

		function stop () {
			clearInterval( pollingTimer );
		}

		function follow ( name ) {
			var idx = followedUsers.indexOf( name )
			if ( idx === -1 ) {
				followedUsers.push( name );
			}
		}

		function unFollow ( name ) {
			var idx = followedUsers.indexOf( name )
			if ( idx === -1 ) {
				return
			}
			followedUsers.splice( idx, 1 );

		}

		function getUsers () {
			return _.map( window.users, function ( user ) {
				return {
					user      :user,
					isFollowed:followedUsers.indexOf( user ) > -1 ? true : false
				}
			} );
		}

		function getFollowedUsers () {
			return followedUsers;
		}

		function getTweets () {
			var tweets = streams.home;
			var displayedTweets = _.chain( _.filter( tweets, function ( tweet ) {
					return (followedUsers.indexOf( tweet.user ) > -1 );
				} ) ).map(function ( tweet ) {
					          tweet.pretty_date = makePrettyDate( tweet.created_at );
					          return tweet;
				          } ).value();

			/*			_.forEach( displayedTweets, function ( tweet ) {
			 console.log( '[' + tweet.pretty_date + '] by @' + tweet.user + ': ' + tweet.message );
			 } );*/

			_.forEach( tweetCallback, function ( callback ) { callback( displayedTweets ); } );
		}

		function tweet ( msg ) {
			// writeTweet( msg ); // Bug: does not timestamp the message.
			var newTweet = {};
			newTweet.user = visitor;
			newTweet.message = msg;
			newTweet.created_at = new Date();
			streams.users[ visitor ].push( newTweet );
			streams.home.push( newTweet );

		}

		/*** Public API ***/
		this.start = start;
		this.stop = stop;
		this.tweet = tweet;
		this.follow = follow;
		this.unFollow = unFollow;
		this.getUsers = getUsers;
		this.setUser = setUser;
		this.getFollowedUsers = getFollowedUsers;
	}
}

$( function () {
	app = new TwittlerApp();
	app.start();

	/* Set user event handler */
	$( '[name="username"]' ).on( 'keypress', function ( event ) {
		if ( (event.keyCode) === 13 ) {
			if ( $( this ).val().length > 1 ) {
				app.setUser( $( this ).val().toLowerCase() );
				$( '[name="tweet"]' ).prop( 'disabled', false ).attr( 'placeholder',
				                                                      'Hi ' + $( this ).val().toLowerCase() +
				                                                      '. Say something clever here...' );
				$( this ).blur();
				$( this ).attr( 'placeholder', $( this ).val().toLowerCase() );
				$( this ).val( '' );
			}
		}
	} );

	$( '[name="tweet"]' ).on( 'keypress', function ( event ) {
		if ( (event.keyCode) === 13 ) {
			app.tweet( $( this ).val() );
			$( this ).blur();
			$( this ).val( '' );
		}
	} );

	/* Follow/UnFollow click event handler */
	$( 'ul' ).on( 'click', 'i', function ( event ) {
		if ( event.target.tagName === 'I' ) {
			if ( $( this ).hasClass( 'icon-thumbs-down' ) ) {
				app.follow( $( event.target ).parent()[0].textContent.trim() );
				$( this ).removeClass( 'icon-thumbs-down' ).addClass( 'icon-thumbs-up' );
			} else {
				app.unFollow( $( event.target ).parent()[0].textContent.trim() );
				$( this ).removeClass( 'icon-thumbs-up' ).addClass( 'icon-thumbs-down' );
			}
		}

	} );

	$( 'ul.tweet-template' ).on( 'scroll', function ( event ) {
		console.log( 'scrolling' );
	} );
} );
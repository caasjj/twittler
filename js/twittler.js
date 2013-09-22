/* twittler.js
 ** This file handles fetching and delivering tweets based on a user's
 ** account criteria.
 */
var twittler = function ( user ) {

	var pollInterval = 2000, pollTimerRef, followedUsers = [];

	/* Internal Initialization and control */
	function init () {
		streams.users[user] = [];
		followedUsers.push( user );
		start();
	}

	function start () {
		pollTimerRef = setInterval( pollTweets, pollInterval );
	}

	function stop () {
		clearInterval( pollTimerRef );
	}

	/* Private Utility Functions to data_generator */
	function pollTweets () {
		dispatchFollowedTweets( streams.home );
	}

	function dispatchFollowedTweets ( tweets ) {

		var followedTweets = _.filter( tweets, function ( tweet ) {
			return followedUsers.indexOf( tweet.user ) > -1;
		} );
		var displayedTweets = _.map( followedTweets, function ( tweet ) {
			tweet.pretty_date = makePrettyDate( tweet.created_at );
			return tweet;
		} );

		_.forEach( displayedTweets, function ( tweet ) {
			console.log( '[' + tweet.pretty_date + '] by @' + tweet.user + ': ' + tweet.message );
		} )
	}

	function makePrettyDate ( date ) {
		var diffInSeconds = Math.floor( ( Date.now() - Date.parse( date ) ) / 1000 ), dateArray = [
		], diffInMins, diffInHrs;

		if ( diffInSeconds % 60 === diffInSeconds ) {
			return diffInSeconds + ' seconds ago...'
		} else {
			if ( diffInSeconds % 3600 === diffInSeconds ) {
				diffInMins = Math.floor( diffInSeconds / 60 );
				diffInSeconds = diffInSeconds % 60;
				dateArray.push( diffInMins + ' minute' + (diffInMins > 1 ? 's' : '') );
				dateArray.push(
					diffInSeconds > 0 ? (diffInSeconds + ' second' + (diffInSeconds > 1 ? 's ago...' : ' ago...')) :
					' ago...' );
				return dateArray.join( ' ' );
			} else {
				if ( diffInSeconds % (3600 * 24) === diffInSeconds ) {
					diffInHrs = Math.floor( diffInSeconds / 3600 );
					diffInMins = Math.floor( (diffInSeconds - 3600 * diffInHrs) / 60 );
					dateArray.push( diffInHrs + ' hour' + (diffInHrs > 1 ? 's' : '') );
					dateArray.push(
						diffInMins > 0 ? (diffInMins + ' minute' + (diffInMins > 1 ? 's ago...' : ' ago...')) :
						'ago...' );
					return dateArray.join( ' ' );
				}
			}
		}
		return 'More than a day ago...';
	}

	/* Public API Functions */
	function follow ( name ) {
		if ( followedUsers.indexOf( name ) === -1 ) {
			followedUsers.push( name );
		}
	}

	function unFollow ( name ) {
		if ( followedUsers.indexOf( name ) > -1 ) {
			followedUsers.splice( followedUsers.indexOf( name ), 1 );
		}
	}

	function tweet ( msg ) {
		writeTweet( msg );
	}

	/* Perform Initializations */
	init();

	return {
		follow  :follow,
		unFollow:unFollow,
		tweet   :tweet,
		start   :start,
		stop    :stop
	}
};

/* Client.js
 ** This file handles user account management, login, logout, etc.
 */
Client = function ( username, password ) {

	function saveCredentials ( username, password ) {
		window.localStorage.username = username;
		window.localStorage.password = password;
		return username;
	}

	function createAcct ( username, password ) {
		if ( window.localStorage.username ) {
			console.log( 'Existing account. Sign in.' );
			return username;
		} else {
			try {
				return saveCredentials( username, password )
			} catch ( e ) {
				alert( 'Cannot create account.  Error: ' + e );
			}
		}
	}

	function checkCredentials ( username, password ) {
		if ( password === undefined ) {
			return window.localStorage.username;
		} else {
			return username === window.localStorage.username && password === window.localStorage.password;
		}
	}

	function isSignedIn () {
		return (typeof visitor !== 'undefined') && visitor === this.username;
	}

	function signIn ( password ) {
		if ( checkCredentials( this.username, password ) ) {
			visitor = this.username;
		} else {
			alert( 'Invalid username / password' );
		}
	}

	function signOut () {
		visitor = null;

	}

	this.username = createAcct( username, password );
	this.isSignedIn = isSignedIn;
	this.signIn = signIn;
	this.signOut = signOut;

}

Client.prototype = {
	deleteAcct:function () {
		this.signOut();
		window.localStorage.clear( 'username' );
		window.localStorage.clear( 'passowrd' );
	}
}

/* twittleViewer.js
 ** This file handles the rendering of the HTML
 */
$( document ).ready( function () {
	var $body = $( 'body' );
	$body.html( '' );
	//twittler();
	var index = streams.home.length - 1;
	while ( index >= 0 ) {
		var tweet = streams.home[index];
		var $tweet = $( '<div></div>' );
		$tweet.text( '@' + tweet.user + ': ' + tweet.message );
		$tweet.appendTo( $body );
		index -= 1;
	}
} );
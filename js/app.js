'use strict';
/* 
location of the bars in Pittsburgh store in  "initialLocations" object array
initialLocations is a array of bar objects 
bar object has attributes name ,lat and long 
name : name of the bar 
lat :latitude
long:longitude
*/
var initialLocations = [
	{//40.485850, -79.872459
		name: 'Baja Bar & Grill',
		lat: 40.485850,
		long: -79.872459
	},
	{//40.442102, -79.956831
		name: "Peter's Pub",
		lat: 40.442102,
		long: -79.956831
	},
	{//40.429152, -79.984007
		name: 'Carson City Saloon',
		lat: 40.429152,
		long: -79.984007
	},
	{//Kelly's Bar & Lounge 40.460017, -79.924428
		name: "Kelly's Bar & Lounge",
		lat: 40.460017,
		long:-79.924428
	},
	{//40.448033, -80.003977
		name: 'Beerhead Bar - Pittsburgh',
		lat: 40.448033,
		long: -80.003977
	},
	{//40.448451, -80.004151
		name: "Mullen's Bar & Grill Inc",
		lat: 40.448451,
		long: -80.004151
	},
	{// 40.428485, -79.979432//--------------------
		name: "Piper's Pub",
		lat: 40.428485,
		long: -79.979432
	},
	{//40.427549, -79.964911
		name: 'Claddagh Irish Pub',
		lat: 40.427549,
		long: -79.964911
	},
	{//40.440215, -80.002364
		name: "Winghart's Burgers",
		lat: 40.440215,
		long: -80.002364
	},
	{//40.454114, -79.982664
		name: 'Cioppino Restaurant & Cigar Bar',
		lat: 40.454114,
		long: -79.982664
	},{//40.446233, -80.010667
		name: 'Bar Louie',
		lat: 40.446233,
		long: -80.010667 
	},{//40.434020, -80.004916
		name: 'Hard Rock Cafe',
		lat:40.434020 ,
		long:-80.004916 
	}
	,{//40.455613, -80.013254
		name: 'Monterey Pub',
		lat: 40.455613,
		long:-80.013254 
	}
	,{//40.428864, -79.986619
		name: 'Jack\'s Bar',
		lat:40.428864 ,
		long: -79.986619
	}
	,{//40.427406, -79.968673
		name: 'Excuses Bar & Grill',
		lat:40.427406 ,
		long:-79.968673 
	}
	,{//40.440307, -80.002646
		name: 'Primanti Bros',
		lat:40.440307 ,
		long:-80.002646 
	}
];

// Declaring global variables now to satisfy strict mode
var map;
var clientID;
var clientSecret;


// formatPhone function referenced from
// http://snipplr.com/view/65672/10-digit-string-to-phone-format/

function formatPhone(phonenum) {
    var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(phonenum)) {
        var parts = phonenum.match(regexObj);
        var phone = "";
        if (parts[1]) { phone += "+1 (" + parts[1] + ") "; }
        phone += parts[2] + "-" + parts[3];
        return phone;
    }
    else {
        //invalid phone number
        return phonenum;
    }
}

var Location = function(data) {
	var self = this;
	this.name = data.name;
	this.lat = data.lat;
	this.long = data.long;
	this.URL = "";
	this.street = "";
	this.city = "";
	this.phone = "";

	this.visible = ko.observable(true);

	var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.long + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

	$.getJSON(foursquareURL).done(function(data) {
		var results = data.response.venues[0];
		self.URL = results.url;
		if (typeof self.URL === 'undefined'){
			self.URL = "";
		}
		self.street = results.location.formattedAddress[0];
     	self.city = results.location.formattedAddress[1];
      	self.phone = results.contact.phone;
      	if (typeof self.phone === 'undefined'){
			self.phone = "";
		} else {
			self.phone = formatPhone(self.phone);
		}
	}).fail(function() {
		alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
	});

	this.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content">' + self.phone + "</div></div>";

	this.infoWindow = new google.maps.InfoWindow({content: self.contentString});

	this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.lat, data.long),
			map: map,
			title: data.name
	});

	this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

	this.marker.addListener('click', function(){
		self.contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content"><a href="tel:' + self.phone +'">' + self.phone +"</a></div></div>";

        self.infoWindow.setContent(self.contentString);

		self.infoWindow.open(map, this);

		self.marker.setAnimation(google.maps.Animation.BOUNCE);
      	setTimeout(function() {
      		self.marker.setAnimation(null);
     	}, 2100);
	});

	this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};
};

function AppViewModel() {
	var self = this;

	this.searchTerm = ko.observable("");

	this.locationList = ko.observableArray([]);

	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 12,//40.468023, -79.962114


			center: {lat:40.422470, lng:  -79.921258}
	});

	// Foursquare API settings
	clientID = "V443OTCAQPJLCRY4QWBFYN3ZK5FDKGJOYDHLMI3O342IRVNN";
	clientSecret = "AK1JHLEG2D2KW14WF5HYVFNTUYFTBXYS4LDUUNRAHPR5URLB";

	initialLocations.forEach(function(locationItem){
		self.locationList.push( new Location(locationItem));
	});

	this.filteredList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
			self.locationList().forEach(function(locationItem){
				locationItem.visible(true);
			});
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
				var string = locationItem.name.toLowerCase();
				var result = (string.search(filter) >= 0);
				locationItem.visible(result);
				return result;
			});
		}
	}, self);

	this.mapElem = document.getElementById('map');
	this.mapElem.style.height = window.innerHeight - 50;
}

function startApp() {
	ko.applyBindings(new AppViewModel());
}

function errorHandling() {
	alert("Google Maps has failed to load. Please check your internet connection and try again.");
}

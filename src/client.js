import { Calendar } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import ICAL from 'ical.js';
import './client.css';

var GoogleAuth; // Google Auth object.

var SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

export function handleClientLoad() {
    // Load the API's client and auth2 modules.
    // Call the initClient function after the modules load.
    gapi.load('client:auth2', initClient);
    // Also setup file upload handler
    document.getElementById('icalFile').addEventListener('change', handleFileSelect, false);
}

var event_array;
var calendar;

function handleFileSelect(evt) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var jcalData = ICAL.parse(e.target.result);
    var comp = new ICAL.Component(jcalData);
    event_array = comp.getAllSubcomponents('vevent').map(function(event){ return new ICAL.Event(event); });
    // initialize calendar and render
    // Convert to FullCalendar events and load
    var calendarEl = document.getElementById('calendar');

    calendar = new Calendar(calendarEl, {
      plugins: [ interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin, rrulePlugin ],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      navLinks: true, // can click day/week names to navigate views
      editable: true,
      dayMaxEvents: true, // allow "more" link when too many events
      events: {
      }
    });
    for (var i = 0; i < event_array.length; i++) {
      var ievent = event_array[i];
      var rrule = ievent.component.getFirstProperty('rrule');

      if (rrule != null) {
        var dtstart = ievent.component.getFirstProperty('dtstart').toICALString();
        var rruleStr = dtstart + "\n" + rrule.toICALString();

        // TODO: need to figure out how to get yearly recurring events DTSTART to parse properly
        if (rrule.toICALString().includes("YEARLY") && dtstart.split("VALUE=DATE:").length > 1) {
          dtstart = "DTSTART:" + dtstart.split("VALUE=DATE:")[1] + "T000000Z";
          rruleStr = dtstart + "\n" + rrule.toICALString();
        }

        calendar.addEvent({
            title: ievent.summary,
            start: ievent.startDate.toString(),
            end: ievent.endDate.toString(),
            rrule: rruleStr,
        });
      }
      else {
        calendar.addEvent({
            title: ievent.summary,
            start: ievent.startDate.toString(),
            end: ievent.endDate.toString(),
        });
      }
    }
    calendar.render();
  }; 
  reader.readAsText(evt.target.files[0]);
}

function initClient() {
  gapi.client.init({
      'apiKey': '',
      'clientId': '',
      'scope': SCOPE,
      'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
  }).then(function () {
      GoogleAuth = gapi.auth2.getAuthInstance();

      // Listen for sign-in state changes.
      GoogleAuth.isSignedIn.listen(updateSigninStatus);

      // Handle initial sign-in state. (Determine if user is already signed in.)
      var user = GoogleAuth.currentUser.get();
      setSigninStatus();

      // Call handleAuthClick function when user clicks on
      //      "Sign In/Authorize" button.
      $('#sign-in-or-out-button').click(function() {
        handleAuthClick();
      });
      $('#revoke-access-button').click(function() {
        revokeAccess();
      });
  });
}

  function handleAuthClick() {
    if (GoogleAuth.isSignedIn.get()) {
      // User is authorized and has clicked "Sign out" button.
      GoogleAuth.signOut();
    } else {
      // User is not signed in. Start Google auth flow.
      GoogleAuth.signIn();
    }
  }

  function revokeAccess() {
    GoogleAuth.disconnect();
  }

  function setSigninStatus() {
    var user = GoogleAuth.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if (isAuthorized) {
      $('#sign-in-or-out-button').html('Sign out');
      $('#revoke-access-button').css('display', 'inline-block');
      $('#auth-status').html('You are currently signed in and have granted ' +
          'access to this app.');

      // Convert to FullCalendar events and load
      var calendarEl = document.getElementById('calendar');

      var calendar = new Calendar(calendarEl, {
        plugins: [ interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin, rrulePlugin ],
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        navLinks: true, // can click day/week names to navigate views
        editable: true,
        dayMaxEvents: true, // allow "more" link when too many events
        events: {
        }
      });

      // Load primary calendar events and log to console
      gapi.client.calendar.events.list({
          'calendarId': 'primary',
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime'
      }).then(function(response) {
        var events = response.result.items;
        for (var i = 0; i < events.length; i++) {
          console.log("Event: " + events[i].summary);
          calendar.addEvent({
              title: events[i].summary,
              start: events[i].start.dateTime,
              end: events[i].end.dateTime
          });
        }
      });

      calendar.render();
    } else {
      $('#sign-in-or-out-button').html('Sign In/Authorize');
      $('#revoke-access-button').css('display', 'none');
      $('#auth-status').html('You have not authorized this app or you are ' +
          'signed out.');
    }
  }

  function updateSigninStatus() {
    setSigninStatus();
  }


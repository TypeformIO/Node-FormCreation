//
//		Typeform I/O Tax Example
//
//	The following script will take the users from users.js, creates one
//	personal typeform for each of them and then show you their email and which
//	url their personal typeform has.
//

if(process.env.API_KEY === undefined) {
	console.log('########');
	console.log('##');
	console.log('## You need to specify your Typeform I/O API-key in environment variable API_KEY');
	console.log('## ');
	console.log('## Exiting...');
	console.log('## ');
	process.exit();
}

var api_key = process.env.API_KEY;

//Utility libraries
var _ = require('underscore');
var request = require('request');

//Getting all the users, probably from DB
var users = require('./users.js');

//Common form for everyone
var base_form = {
	title: 'Updating your information!',
	fields: [
		{
			type: 'statement',
			question: 'Hello <%= name %>! Hope you\'re doing fine today!'
		},
		{
			type: 'yes_no',
			question: 'Do you still live in <%= location %>?'
		}
	]
}

//"variable" questions, depends on data from user
var is_owning_house_question = {
	type: 'yes_no',
	question: 'Do you still own your house?'
}

var is_not_owning_house_question = {
	type: 'yes_no',
	question: 'Did you buy a house this year?'
}

//For each user
var users = _.map(users, function(user) {

	//Copy form instead of reference
	user.form = _.clone(base_form);

	// Save new fields in new array
	var new_fields = [];

	//For each user
	_.each(user.form.fields, function(field) {

		//Copy instead of reference, with the type as well
		new_field = _.clone(field);
		new_field.type = field.type;

		//Creating and preparing a template
		template = _.template(new_field.question);

		// Executing and parsing template, placing correct names into the variables
		new_field.question = template({
			name: user.name,
			location: user.location
		});

		//Add the new field to the new_fields in new array
		new_fields.push(new_field);
	});

	//Replace the old, unparsed fields with the new, parsed fields
	user.form.fields = new_fields

	//If the user has a home
	if(user.has_home) {
		//Add the question about house like the user has it
		user.form.fields.push(is_owning_house_question);
	} else {
		//Otherwise, add question asking if they have got one this year
		user.form.fields.push(is_not_owning_house_question);
	}
	return user;
});


//Helper function for creating a typeform
function create_form(form, success) {
	request
		//The url of the API endpoint
		.post('https://api.typeform.io/v0.1/forms', {
			//Including the typeform as JSON
			json: form,
			headers: {
				//The API-key, is a secret, do not share
				'X-API-TOKEN': api_key
			}
		})
	//When we receive an response from the API-call we make above
	.on('response', function(response) {
		var data = '';
		//Start receiving data form the response
		response.on('data', function(newData) {
			data = data + newData;
		});
		//We finished receiving data, call the success() callback with the data parsed
		//from JSON
		response.on('end', function() {
			success(JSON.parse(data));
		});
	});
}

//Show a message for the email with a link to the form
function show_message(email, link) {
	console.log(email + ' got form ' + link);
}

//For all the users,
_.each(users, function(user) {
	//Create the form
	create_form(user.form, function(data) {
		//When form been created, get the link to render the form
		var form_link = data.links.form_render.get
		//Show a message in the terminal
		show_message(user.email, form_link)
	});
});

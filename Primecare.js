// Create all of the Collection variables

Nurse = new Mongo.Collection("nurse");
PCG = new Mongo.Collection("pcg");
Patient = new Mongo.Collection("patient");
Report = new Mongo.Collection("report");
Comments = new Mongo.Collection("comments");


// Routing section. All pages which will be viewed are added as routes, with the template and home page included.
Router.route('/SearchResult');
Router.route('/SubmitUpdate');
Router.route('/Search');
Router.route('/Settings');
Router.route('/Contact');
Router.route('/PatientInfo');
Router.route('/AddPatient');
Router.route('/AddNurse');
Router.route('/AddPCG');
Router.route('/DeleteUsers');


Router.route('/Report/:_id', {
    name: 'Report',
    data: function () {
        return Report.findOne(this.params._id);
    }
});

Router.route('/', {
    name: 'Home',
    template: 'Home'


});
//configure the router to set which navigation is set to active and set up the subscriptions
Router.configure({
    layoutTemplate: 'Layout',
    onAfterAction: function(){
        var routeName = "#" + (Router.current().route.getName());
                $('li a').removeClass("active");
                $(routeName).addClass("active");
    },

    subscriptions: function () {
            if (Meteor.user()) {
                var user = Meteor.user().username;
                this.subscribe("report", user).wait;
                this.subscribe("comments", user).wait;
                this.subscribe("patient", user).wait;
                this.subscribe("nurse", user).wait;
                this.subscribe("pcg", user).wait;
                this.subscribe('userList', user).wait;
            }
    }
});


// Uncomment this out to populate the database, and then recomment back
Meteor.startup(function () {
    Meteor.users.remove({});
    Meteor.roles.remove({});
    Nurse.remove({});
    PCG.remove({});
    Patient.remove({});
    Report.remove({});
    Comments.remove({});

    var reportInsert = [{
        _id: "ibALtysozr44RJq2w",
        patID: "PAT0001",
        nrsID: "NRS0001",
        urgency: "high",
        date: moment().format("MMMM D, YYYY [ at ] HH:mm"),
        form: "This is a super long report blah blah. Good times"
    }, {
        _id: "htE6uf9d9q6Sz8p7w",
        patID: "PAT0002",
        nrsID: "NRS0002",
        urgency: "med",
        date: moment().format("MMMM D, YYYY [ at ] HH:mm"),
        form: "Blha blah blah blah blah. Lorem Ipsum "
    }]
    var userInsert = [{username: "ADMIN", roles: ['Admin']}, {
        username: "PCG0001",
        roles: ['Primary Care Giver']
    }, {username: "PCG0002", roles: ['Primary Care Giver']}, {
        username: "NRS0001",
        roles: ['Nurse']
    }, {username: "NRS0002", roles: ['Nurse']}];
    var pcgInsert = [{
        _id: "PCG0001",
        relationship: "daughter",
        name: "Jane Doe",
        address: "123 fake st.",
        phoneNumber: "111-111-1111"
    }, {
        _id: "PCG0002",
        relationship: "son",
        name: "Matt Foley",
        address: "Van down by the river",
        phoneNumber: "000-000-0000"
    }];
    var nurseInsert = [{_id: "NRS0001", name: "Dawn Smith", title: "Charge Nurse"}, {
        _id: "NRS0002",
        name: "Betty White",
        title: "Nurse Aide"
    }];
    var patientInsert = [{
        _id: "PAT0001",
        pcgID: "PCG0001",
        name: "John Doe",
        age: "79",
        gender: "Male",
        roomNo: "325",
        moveInDate: "2010-01-21",
        meds: "advil",
        diet: "dairy"
    },
        {
            _id: "PAT0002",
            pcgID: "PCG0002",
            name: "Elvis Presley",
            age: "81",
            gender: "Male",
            roomNo: "123",
            moveInDate: "2000-02-01",
            meds: "Viagra",
            diet: "Gluten"
        }];
    var commentInsert = [{
        pcgID: "PCG0001",
        reportID: "ibALtysozr44RJq2w",
        date: (moment().format("MMMM D, YYYY [ at ] HH:mm:ss")),
        subject: "Get er done",
        message: "This is a comment for NRS0001 from PCG0001",
        unread: true
    },
        {
            pcgID: "PCG0002",
            reportID: "htE6uf9d9q6Sz8p7w",
            date: (moment().format("MMMM D, YYYY [ at ] HH:mm:ss")),
            subject: "Get er done",
            message: "This is a comment for NRS0002 from PCG0002",
            unread: true
        }];
    _.each(reportInsert, function (reportInsert) {
        Report.insert(reportInsert);
    });

    _.each(userInsert, function (user) {
        var id;

        id = Accounts.createUser({
            username: user.username,
            password: "1"
        });

        if (user.roles.length > 0) {
            // Need _id of existing user record so this call must come
            // after `Accounts.createUser` or `Accounts.onCreate`
            Roles.addUsersToRoles(id, user.roles);
        }
    });


    // Insert PCGs into Database
    _.each(pcgInsert, function (pcgInsert) {
        PCG.insert(pcgInsert);
    });

    // Insert Nurses into Database
    _.each(nurseInsert, function (nurseInsert) {
        Nurse.insert(nurseInsert);
    });

    // Insert Patients into Database
    _.each(patientInsert, function (patientInsert) {
        Patient.insert(patientInsert);
    });

    //Insert comments into Database
    _.each(commentInsert, function (commentInsert) {
        Comments.insert(commentInsert);
    });

});
if (Meteor.isServer) {
    // This code only runs on the server

    //publish reports based on user
    Meteor.publish("report", function (userN) {
        console.log(this.username);
        if (userN.startsWith("NRS")) {
            return Report.find();
        } else if (userN.startsWith("PCG")){
            var pat = Patient.find({pcgID: userN}, {"_id:": 1});

            return Report.find({patID: pat.fetch()[0]._id});
        } else if (userN==="Admin"){
            return Report.find();
        }
    });

    //publish comments associated with username
    Meteor.publish("comments", function (userN) {
        if (userN.startsWith("PCG")) {
            var pat=Patient.find({pcgID:userN});
            var rep=Report.find({patID:pat.fetch()[0]._id});

            return Comments.find({}, {reportID:rep.fetch()[0]._id});
        } else if (userN.startsWith("NRS")){
            var rep=Report.find({nrsID:userN});
            return Comments.find({}, {reportID:rep.fetch()[0]._id});
        }else if (userN==="Admin"){
            return Comments.find();
        }
    });

    //nurses and admin have full access to patient info. PCG's only have access to patient they are associated with.
    Meteor.publish("patient", function (userN) {
        if (userN.startsWith("NRS") || userN==="Admin") {
            return Patient.find();
        }else if (userN.startsWith("PCG")){
            return Patient.find({pcgID:userN});

        }
    });

    //There is no sensitive info kept on nurses so only check to see if user is logged in
    Meteor.publish("nurse", function (userN) {
        if (userN) {
            return Nurse.find();
        }
    });

    //Nurses and admin have full access to PCG info. PCG's only have access to their own info.
    Meteor.publish("pcg", function (userN) {
        if (userN.startsWith("PCG")){
            return PCG.find({_id:userN});
        }else if (userN.startsWith("NRS") || userN==="Admin") {
            return PCG.find();
        }
    });

    //only admin has access to full user login list
    Meteor.publish('userList', function (userN) {
        if (userN==="ADMIN"){
        return Meteor.users.find({});
        }
    });
    Meteor.methods({

        //this will check if the user is a nurse and mark a comment as read
        'markRead': function (repID) {
            if (Roles.userIsInRole(Meteor.user(), "Nurse")) {
                Comments.update(
                    {reportID: repID},
                    {$set: {unread: false}},
                    {multi: true}
                )
            }},

        //checks if user is nurse and updates patient info
        'updatePatient': function (patArr) {

             if (Roles.userIsInRole(Meteor.user(), "Nurse")) {

                 Patient.update(
                     {_id: patArr[7]},
                     {
                         $set: {

                             name: patArr[0],
                             age: patArr[1],
                             gender: patArr[2],
                             roomNo: patArr[3],
                             moveInDate: patArr[4],
                             meds: patArr[5],
                             diet: patArr[6]
                         }
                     }
                 );
             }
        },

        //checks if user is admin and creates a new nurse
        'createNurse': function (nurse) {
            if (Roles.userIsInRole(Meteor.user(), "Admin")) {
                Nurse.insert(
                    {_id: nurse[0], name: nurse[1], title: nurse[2]}
                );
            }
        },

        //checks if user is admin and creates a new pcg
        'createPCG': function (pcg) {
            if (Roles.userIsInRole(Meteor.user(),"Admin")) {
                PCG.insert(
                    {
                        _id: pcg[0], name: pcg[1], relationship: pcg[2],
                        address: pcg[3], phoneNumber: pcg[4]
                    }
                );
            }
        },

        //checks to see if user is admin and creates a new patient
        'createPatient': function (pat) {
            if (Roles.userIsInRole(Meteor.user(),"Admin")) {
                Patient.insert(
                    {
                        _id: pat[0],
                        pcgID: pat[1],
                        name: pat[2],
                        age: pat[3],
                        gender: pat[4],
                        roomNo: pat[5],
                        moveInDate: pat[6],
                        meds: pat[7],
                        diet: pat[8]
                    }
                );
            }
        },

        //checks to see if user is admin and creates a new user
        'addUser': function (user) {
            if (Roles.userIsInRole(Meteor.user(),"Admin")) {
                var id;

                id = Accounts.createUser({
                    username: user[0],
                    password: user[1]
                });

                if (user[2].length > 0) {
                    // Need _id of existing user record so this call must come
                    // after `Accounts.createUser` or `Accounts.onCreate`
                    Roles.addUsersToRoles(id, user[3]);
                }

        }

        },

        //checks to see if the current user is the same user submitting the comment and submits a comment
        'submitComment': function (pcgId, repNo, sub, mes) {

            if (Meteor.user().username === pcgId) {
                Comments.insert({
                    pcgID: pcgId,
                    reportID: repNo,
                    date: moment().format("MMMM D, YYYY [ at ] HH:mm:ss"),
                    subject: sub,
                    message: mes,
                    unread: true

                });
            }
        },
        //checks to see if user is a nurse and submits a new report
        'submitReport': function (patientID, nurseID, urgency, formText) {
            if (Roles.userIsInRole(Meteor.user()), "Nurse") {
                Report.insert({
                    patID: patientID,
                    nrsID: nurseID,
                    urgency: urgency,
                    date: moment().format("MMMM D, YYYY [ at ] HH:mm"),
                    form: formText
                })
            }
        },

        //checks if user is admin and deletes user
        'deleteUser': function (uName) {
            if (Roles.userIsInRole(Meteor.user(), "Admin")) {
                Meteor.users.remove({username: uName});
            }
        },

        //retreives the id number as an int for the create user autofill
        'getID': function (type) {
            if (Roles.userIsInRole(Meteor.user(), "Admin")) {
                if (type === 'PAT') {

                    var pats = Patient.find();
                    var temp = 0;
                    var comp;
                    var patNo;
                    pats.forEach(function (doc) {
                        patNo = doc._id.split('T');
                        comp = parseInt(patNo[1]);

                        if (comp > temp) {
                            temp = comp;
                        }
                    });
                    return temp;
                } else if (type === "NRS") {
                    var pats = Nurse.find();
                    var temp = 0;
                    var comp;
                    var nrsNo;
                    pats.forEach(function (doc) {
                        nrsNo = doc._id.split('S');
                        comp = parseInt(nrsNo[1]);

                        if (comp > temp) {
                            temp = comp;
                        }
                    });
                    return temp;
                } else if (type === "PCG") {
                    var pats = PCG.find();
                    var temp = 0;
                    var comp;
                    var patNo;
                    pats.forEach(function (doc) {
                        patNo = doc._id.split('G');
                        comp = parseInt(patNo[1]);

                        if (comp > temp) {
                            temp = comp;
                        }
                    });
                    return temp;
                }
            }
        }
    });

}

if (Meteor.isClient) {

    //helper for the navigation bar returns the user name to display welcome
    Template.Navigation.helpers({
        usersName: function () {
            var userN = Meteor.user().username;
            if (userN.startsWith("NRS")) {

                return Nurse.findOne({_id: Meteor.user().username}).name;
            } else {

                return PCG.findOne({_id: Meteor.user().username}).name;
            }
        }
    });


    //event handler for login checks user credentials
    Template.Login.events({
        'submit form': function (event) {
            event.preventDefault();
            var nameVar = event.target.loginUser.value;
            var passwordVar = event.target.loginPassword.value;
            // $("#hide").remove();
            // $( ".message_cont" ).remove();
            Meteor.loginWithPassword(nameVar, passwordVar, function (error) {
                if (error) {
                    $("#msg").html("<br><br><br><br><br>Login Error: " + error.reason + "<br>Please try again");
                    $("#hide").show();
                    $("#hide").delay(3500).fadeOut("slow");
                } else {
                    $("#hide").hide();
                    $("#msg").hide();

                    Router.go('Home');
                }
            })
        }
    });

    //effects for the login page
    Template.Login.rendered = function () {
        document.body.style.background = "url('/img/Login.jpg') no-repeat center center fixed";
        Meteor.startup(function(){
            $("#LoginDiv").hide();
            $("#LoginDiv").delay(1).fadeIn("fast");
            $("#hide").hide();
        });
    };

    //boolean to check if there is a search query in the session
    Template.Search.helpers({
        hasResults: function () {
            if (Session.get("searchQry") !== null) {
                return true;
            } else {
                return false;
            }
        }
    });

    //event handler for search events for text input and submit form and adds search query to the session
    Template.Search.events({

        'submit .searchPat': function (event) {

            event.preventDefault();
            var searchQry = event.target.Query.value;
            Session.set('searchQry', searchQry);
            Router.go('Search');


        },

        'input .Query': function (event) {

            event.preventDefault();
            var searchQry = event.currentTarget.value;
            Session.set('searchQry', searchQry);
            // Router.go('Search');

        }
    });

    //checks cookies to see if auto-complete is off or on
    Template.Search.rendered = function() {
        if(!Cookie.get(Meteor.userId() + "autocomplete")){
            $("#Query").attr("autocomplete", "on");
        }

        if(Cookie.get(Meteor.userId() + 'autocomplete') === "true" ){
            $("#Query").attr("autocomplete", "on");
        }else{
            $("#Query").attr("autocomplete", "off");
            $(".searchPat").attr("autocomplete", "off");
        }
    };

    //helpers for search result that display the search query, pcg name (instead of Id number), result collections
    // and the number of results.
    Template.SearchResult.helpers({
        searchFor: function () {
            var sessSearch = Session.get('searchQry');

            return sessSearch;
        },
        pcgName: function () {

            if (Roles.userIsInRole(Meteor.user(), "Primary Care Giver")){

                return PCG.findOne({_id: Meteor.user().username}).name;

            }else if (Roles.userIsInRole(Meteor.user(), "Nurse")){
                return PCG.findOne({_id: this.pcgID}).name;
            }
        },
        result: function () {

            if (Roles.userIsInRole(Meteor.user(),"Primary Care Giver")){
                var pat = Patient.find({pcgID: Meteor.user().username});

                return pat;
            }else {
                var sessSearch = Session.get('searchQry');
                if(sessSearch !== undefined){
                    if (sessSearch.toUpperCase().startsWith("PAT")) {

                    return Patient.find({"_id": {$regex: ".*" + sessSearch.toUpperCase() + ".*"}});
                } else {

                    return Patient.find({"name": {$regex: ".*" + sessSearch + ".*"}});
                }
            }}
        },
        countResults: function () {
            var sessSearch = Session.get('searchQry');
            if (sessSearch.toUpperCase().startsWith("PAT")) {

                return Patient.find({"_id": {$regex: ".*" + sessSearch.toUpperCase() + ".*"}}).count();
            } else {

                return Patient.find({"name": {$regex: ".*" + sessSearch + ".*"}}).count();
            }
        }
    });

    //event handlers for the search results which give the options to edit patient info or submit a report on patient
    Template.SearchResult.events({
        'click #Edit': function (event) {
            event.preventDefault();

            var patNo = event.target.value;
            Session.set('patID', patNo);
            Router.go('PatientInfo');
        },
        'click #Report': function (event) {
            event.preventDefault();

            var patNo = event.target.value;

            Session.set('patID', patNo);
            Router.go('SubmitUpdate');
        }
    });

    //event handler for the patient info that either submits the changes to the patient info or redirects back to
    //search results
    Template.PatientInfo.events({
        'submit .patientForm': function (event) {
            event.preventDefault();

            var pName = event.target.name.value;
            var pAge = event.target.age.value;
            var pSex = event.target.sex.value;
            var pRoom = event.target.room.value;
            var pMoveDate = event.target.moveDate.value;
            var pMeds = event.target.medication.value;
            var pDiet = event.target.diet.value;
            var patID = event.target.PatID.value;
            var pat = [pName, pAge, pSex, pRoom, pMoveDate, pMeds, pDiet, patID];
            Meteor.call('updatePatient', pat);
            Router.go('Search');
        },
        'click #reset': function (event) {

            event.preventDefault();
            Router.current().render(Template.PatientInfo).data();

        }


    });

    //helper auto-fills fields with patient info
    Template.PatientInfo.helpers({

        result: function () {
            var userN = Meteor.user().username;
            if (userN.startsWith("NRS")) {
                var patID = Session.get('patID');
            } else {
                var patID = Patient.findOne({"pcgID": Meteor.user().username})._id;
            }
            return Patient.find({"_id": patID});

        },
        pcgName: function () {
            var userN = Meteor.user().username;
            if (userN.startsWith("NRS")) {
                var patID = Session.get('patID')
                var pcg = Patient.findOne({"_id": patID}).pcgID;
            } else {
                return PCG.findOne({"_id": Meteor.user().username}).name;
            }
            return PCG.findOne({'_id': pcg}).name;
        }
    });

    //event handler submits a new report and sets cookies so that the text will be saved if the user leaves and
    //comes back
    Template.SubmitUpdate.events({

        'submit .nurseInput': function (event) {

            event.preventDefault();


            var patientID = event.target.patientID.value;
            var nurseID = Meteor.user().username;
            var formText = event.target.formText.value;
            var urgency = event.target.urgency.value;

            Meteor.call('submitReport', patientID, nurseID, urgency, formText );


            // Clear Form
            event.target.patientID.value = "";
            event.target.formText.value = "";
            event.target.urgency.value = "";

            Cookie.remove('patientID');
            Cookie.remove('formText');
            Cookie.remove('urgency');
            // Reroute
            Router.go('Home');
        },

        'blur #patientID': function (event) {
            event.preventDefault();

            var patientID = event.currentTarget.value;
            Cookie.set('patientID', patientID, {});

        },
        'blur #formText': function (event) {
            var formText = event.currentTarget.value;
            Cookie.set('formText', formText, {});
        },
        'blur #urgency': function (event) {
            event.preventDefault();
            var urgency = event.currentTarget.value;
            Cookie.set('urgency', urgency, {});
        }

    });

    //checks to see if cookies exist containing unsubmitted report text and populates the fields with it
    Template.SubmitUpdate.rendered = function() {

        if(Cookie.get('patientID')){
            $('#patientID').attr('value', Cookie.get('patientID'));
        };

        if(Cookie.get('formText')){
            $('#formText').val(Cookie.get('formText'));
        };

        if(Cookie.get('urgency')){
            $('input[name="urgency"][value="' + Cookie.get('urgency') + '"]').prop('checked', true);
        };
    };

    //auto fills the patient id number if navigated to from search result
    Template.SubmitUpdate.helpers({

        patId: function () {
            return Session.get('patID')
        },


        patExists: function () {
            if (Session.get('patID') != null) {
                return true;
            } else {
                return false;
            }
        }
    });

    //creates cookies to hold user settings
    Template.Settings.events({

        'submit .settings': function (event) {

            event.preventDefault();

            var darktheme = event.target.darktheme.checked;
            var autocomplete = event.target.autocomplete.checked;

            Cookie.set(Meteor.userId() + 'darktheme', event.target.darktheme.checked, {expires: 30});
            Cookie.set(Meteor.userId() + 'autocomplete', event.target.autocomplete.checked, {expires: 30});
            // Reroute
            Router.go('Home');
        }
    });

    //checks cookies to see which settings are on and renders settings template with corresponding settings
    Template.Settings.rendered = function() {
       if(!Cookie.get(Meteor.userId() + "autocomplete")){
           Cookie.set(Meteor.userId() + 'autocomplete', true, {expires: 30});
       }


        if(Cookie.get(Meteor.userId() + 'darktheme') === "true"){
                $('#slidetwo').prop('checked', true);
            }else{
                $('#slidetwo').prop('checked', false);
            }

        if(Cookie.get(Meteor.userId() + 'autocomplete') === "true" ){
                $('#slideThree').prop('checked', true);
            }else{
                $('#slideThree').prop('checked', false);
            }
    };

    //helper auto fills nurse id number for a new nurse
    Template.AddNurse.helpers({
        uName: function () {


            Meteor.call('getID','NRS', function callback (error, result){
                if (!error){
                    Session.set('NRSnum', result);
                }else
                    console.log(error);
            });
            var num=Session.get('NRSnum');
            if(9>=num) {
                return "NRS000" + (num + 1);
            }else if (9<num<99){
                return "NRS00"+ (num+1);
            }
        }

    });

    //helper auto fills patient id and pcg id when creating a new patient
    Template.AddPatient.helpers({
        pcgid: function () {


            Meteor.call('getID','PAT', function callback (error, result){
               if (!error){
                   Session.set('PATnum', result);
               }else
                console.log(error);
            });
            var num=Session.get('PATnum');
            if(9>=num) {
                return "PCG000" + (num + 1);
            }else if (9<num<99){
                return "PCG00"+ (num+1);
            }


        },
        patId:
            function () {


                Meteor.call('getID', 'PAT', function callback(error, result) {
                    if (!error) {
                        Session.set('PATnum', result);
                    } else
                        console.log(error);
                });
                var num = Session.get('PATnum');
                if (9 >= num) {
                    return "PAT000" + (num + 1);
                } else if (9 < num < 99) {
                    return "PAT00" + (num + 1);
                }

            }

    });

    //helper auto fills pcg id when creating a new pcg
    Template.AddPCG.helpers({
        uName:function () {


            Meteor.call('getID', 'PCG', function callback(error, result) {
                if (!error) {
                    Session.set('PCGnum', result);
                } else
                    console.log(error);
            });
            var num = Session.get('PCGnum');
            if (9 >= num) {
                return "PCG000" + (num + 1);
            } else if (9 < num < 99) {
                return "PCG00" + (num + 1);
            }
        }
    });

    //lists all the users for the admin to delete and returns a boolean so that the admin can't be deleted
    Template.Admin.helpers({

        allUsers: function () {

            return Meteor.users.find();
        },
        isNotAdmin: function (name) {
            if (name !== "ADMIN") {
                return true;
            }
        }
    });

    //event handler that allows the admin to delete a user
    Template.Admin.events({

        'click .Delete': function (event) {

            var usName = event.target.value;
            Meteor.call('deleteUser', usName);

        }

    });

    //event handler submits new pcg info into pcg collection and users collection
    Template.AddPCG.events({
        'submit .addPCG': function (event) {
            event.preventDefault();

            var username = event.target._id.value;
            var name = event.target.name.value;
            var relationship = event.target.relationship.value;
            var address = event.target.address.value;
            var phoneNumber = event.target.phoneNumber.value;
            var password = event.target.passWord.value;
            var role = "Primary Care Giver";
            var user = [username, password, role];
            var pcg = [username, name, relationship, address, phoneNumber];
            var userNo = username.split('G');
            userNo = parseInt(userNo[1]);
            console.log(userNo);
            Session.set('PCGTemp', userNo);
            Meteor.call('createPCG', pcg);
            Meteor.call('addUser', user);
            alert("Primary Care Giver Created!");
            $('.addPCG').trigger("reset");
        }
    });

    //event handler submits new nurse info into nurse collection and users collection
    Template.AddNurse.events({
        'submit .addNurse': function (event) {
            event.preventDefault();

            var username = event.target._id.value;
            var name = event.target.name.value;
            var title = event.target.title.value;
            var password = event.target.passWord.value;
            var nurse = [username, name, title];
            var role = "Nurse";
            var user = [username, password, role];
            Meteor.call('addUser', user);
            Meteor.call('createNurse', nurse);
            alert("Nurse Created!");
            $('.addNurse').trigger("reset");
        }
    });

    //event handler submits new patient info into patient collection
    Template.AddPatient.events({
        'submit .addPatient': function (event) {
            event.preventDefault();

            var username = event.target._id.value;
            var pcgID = event.target.pcgID.value;
            var name = event.target.name.value;
            var age = event.target.age.value;
            var gender = event.target.gender.value;
            var roomNo = event.target.roomNo.value;
            var moveInDate = event.target.moveInDate.value;
            var meds = event.target.meds.value;
            var diet = event.target.diet.value;
            var pat = [username, pcgID, name, age, gender, roomNo, moveInDate, meds, diet];
            Meteor.call('createPatient', pat);
            alert("Patient Created!");
            $('.addPatient').trigger("reset");
        }
    });


//comment helper that displays all comments associated with a report, sorts them by date and returns a count.
    Template.comments.helpers({
        comms: function () {
            return Comments.find({"reportID": this._id}, {sort: {date: -1}});
        },
        commentTotal: function () {

            return Comments.find({"reportID": this._id}).count();
        }
    });

    //quick nav helper returns a list of the reports
    Template.navList.helpers({
        navEntry: function () {
            var userN = Meteor.user().username;
            if (Roles.userIsInRole(Meteor.user(), "Nurse")) {
                return Report.find({nrsID: userN}, {sort: {date: -1}});
            } else {
                var pat = Patient.find({pcgID: userN}, {"_id:": 1});
                return Report.find({patID: pat.fetch()[0]._id}, {sort: {date: -1}});
            }
        },

        dateformatted: function () {
            var formDate = this.date.substring(0, this.date.indexOf("at"));
            return formDate;
        },

        unreadTotal: function () {
            var count = Comments.find({$and: [{unread: true}, {'reportID': this._id}]}).count();
            if (count > 0) {
                return count;
            } else {
                return "";
            }

        }
    });


//helper for the quicknav while viewing a particular report
    Template.navListReport.helpers({
        navEntry: function () {
            var userN = Meteor.user().username;
            if (Roles.userIsInRole(Meteor.user(), "Nurse")) {

                return Report.find({nrsID: userN}, {sort: {date: -1}});
            } else {
                var pat = Patient.find({pcgID: userN}, {"_id:": 1});
                return Report.find({patID: pat.fetch()[0]._id}, {sort: {date: -1}});
            }
        },
        dateformatted: function () {
            var formDate = this.date.substring(0, this.date.indexOf("at"));
            return formDate;
        }
    });

    Template.nurse.helpers({
        nurses: function () {
            return Nurse.find({});
        }
    });

    //event handler for logout
    Template.Navigation.events({
        'click .logout': function (event) {
            event.preventDefault();
            Object.keys(Session.keys).forEach(function(key){
                Session.set(key, undefined);
            });
            Session.keys = {}; // remove session keys
            Meteor.logout();
            Router.go('Home');
            // $("#msg").html("<br><br><br><br><br>You have Successfully logged out");
            $("#hide").delay(500).fadeOut("slow");
        }
    });

    //event handoer for logout
    Template.Footer.events({
        'click .logout': function (event) {
            event.preventDefault();
            Object.keys(Session.keys).forEach(function(key){
                Session.set(key, undefined);
            });
            Session.keys = {}; // remove session keys
            Meteor.logout();
            Router.go('Home');
            // $("#msg").html("<br><br><br><br><br>You have Successfully logged out");
            $("#hide").delay(500).fadeOut("slow");
        }
    });




//formatting the quickNav for different useres
    Template.Home.rendered = function(){
        $('#Home').addClass("active");
        Meteor.startup(function(){
            var userN = Meteor.user().username;
            if (!userN.startsWith("ADMIN")) {

                var top = $('#dateNav').offset().top - parseFloat($('#dateNav').css('marginTop').replace(/auto/, 0));
                $(window).scroll(function (event) {
                    // what the y position of the scroll is
                    var y = $(this).scrollTop();

                    // whether that's below the form
                    if (y >= top) {
                        // if so, ad the fixed class
                        $('#dateNav').addClass('fixed');
                    } else {
                        // otherwise remove it
                        $('#dateNav').removeClass('fixed');
                    }
                });
            }
        });
    };

    //Template.Report.helpers({
    //    report: function () {
    //        return Report.find({});
    //    }
    //});

    //event handler for submitting comments
    Template.Report.events({
        'submit .commentSubmission': function (event) {
            event.preventDefault();
            var pcgId = Meteor.user().username;
            var repNo = event.target.repNo.value;
            var sub = event.target.subj.value;
            var mes = event.target.message.value;

            Meteor.call('submitComment', pcgId, repNo, sub, mes);


            // Clear Form
            event.target.subj.value = "";
            event.target.message.value = "";
        }
    });

    //effects for the hidden comment form
    Template.Report.rendered = function(){

        if (Roles.userIsInRole(Meteor.user(), "Primary Care Giver")) {
            Meteor.startup(function () {
                $('#toggle').click(function () {
                    $('#hidden').stop().slideToggle(500);
                    return false;
                });
            });
        }

        $('#Home').addClass("active");
        Meteor.startup(function(){
            var top = $('#dateNav').offset().top - parseFloat($('#dateNav').css('marginTop').replace(/auto/, 0));
            $(window).scroll(function (event) {
                // what the y position of the scroll is
                var y = $(this).scrollTop();

                // whether that's below the form
                if (y >= top) {
                    // if so, ad the fixed class
                    $('#dateNav').addClass('fixed');
                } else {
                    // otherwise remove it
                    $('#dateNav').removeClass('fixed');
                }
            });
        });
    };

    //helper lists the different reports depending on the user
    Template.entries.helpers({

        report: function () {

            var userN = Meteor.user().username;
           // Meteor.subscribe("report", userN);
            if (Roles.userIsInRole(Meteor.user(), "Nurse")) {

                return Report.find({nrsID: userN}, {sort: {date: -1}});

            } else if (Roles.userIsInRole(Meteor.user(), "Primary Care Giver")){
                var pat = Patient.find({pcgID:userN}, {"_id:": 1});

                return Report.find({patID: pat.fetch()[0]._id}, {sort: {date: -1}});
            }
        },
        unreadTotal: function () {
            var count = Comments.find({$and: [{unread: true}, {'reportID': this._id}]}).count();
            if (count > 0) {
                return count;
            } else {
                return "";
            }

        }
    });
//event handler brings user to a particular report and sets the comments to read
    Template.entries.events({
        'click .more': function (event) {
            if (Roles.userIsInRole(Meteor.user(), "Nurse")) {
                Meteor.call('markRead', this._id);
            }
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    //returns the total number of unread comments
    Template.unread.helpers({
        unReadCount: function () {

                var nurseRepsCol = Report.find({nrsID: Meteor.user().username}, {_id: 1});
            var nurseReps = [];
            nurseRepsCol.forEach(function (value, index) {
                nurseReps[index] = nurseRepsCol.fetch()[index]._id;

            });

            return Comments.find({$and: [{unread: true}, {'reportID': {$in: nurseReps}}]}).count();
        }

    });

}
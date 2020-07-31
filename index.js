const Alexa = require('ask-sdk-core');
const Util = require('./util.js');

const welcomeMessage = `Welcome to the Amazon intern trivia game! You can play by yourself or with up to four teams. How many teams are playing? If it's just you, say one team. `;
const startQuizMessage = `Let's get started! `;
const exitSkillMessage = `Thank you for playing! Come back again soon for new questions! `;
const helpMessage = `Please answer starting with what is? or who is? `;
const helpMessageNum = `Please say something like one team or two teams. `;
const helpMessageName = `Please say a single name. `;
const errorMessage = `Hmm, that didn't sound like something I'm familiar with. `;
const numRounds = 3;
const maxPlayers = 4;
var highScore = 0;
const pointMultiplier = 10; //multiplied by round to determine points for each question
const Airtable = require('airtable');
// fill this in with your own API key (https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-)
const base = new Airtable({apiKey: 'key34ifeIDTP0RsPu'}).base('appPCPv2GlOfZ6wLe');

/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.custom();
//made a var to allow for shuffling at beginning of each game
var teamColors = [`green`, `blue`, `purple`, `orange`, `gray`, `ivory`, `maroon`, `aquamarine`, `coral`, `crimson`, `khaki`, `magenta`, `plum`, `olive`, `cyan`, `lime`, `silver`, `gold`, `teal`];
const speechConsCorrect = ['Booya', 'All righty', 'Bam', 'Bazinga', 'Bingo', 'Boom', 'Bravo', 'Cha Ching', 'Cheers', 'Dynomite', 'Hip hip hooray', 'Hurrah', 'Hurray', 'Huzzah', 'Oh dear.  Just kidding.  Hurray', 'Kaboom', 'Kaching', 'Oh snap', 'Phew','Righto', 'Way to go', 'Well done', 'Whee', 'Woo hoo', 'Yay', 'Wowza', 'Yowsa'];
const speechConsWrong = ['Argh', 'Aw man', 'Blarg', 'Blast', 'Boo', 'Bummer', 'Darn', "D'oh", 'Dun dun dun', 'Eek', 'Honk', 'Le sigh', 'Mamma mia', 'Oh boy', 'Oh dear', 'Oof', 'Ouch', 'Ruh roh', 'Shucks', 'Uh oh', 'Wah wah', 'Whoops a daisy', 'Yikes'];
var dataEasy = [
    {quest: 'This person founded Amazon.com', 
    answer: ['jeff bezos', 'jeff', 'bezos', 'Mr. bezos', 'el jefe'], 
    story: 'Amazon was founded in Bellevue, Washington, on July 5, 1994. The company started as an online marketplace for books but expanded to sell just about everything', 
    level: 'easy'}, 
    
    {quest: 'This is the city where Amazon Headquarters is located', 
    answer: ['seattle'], 
    story: 'Seattle is also home to the amazon spheres, the space needle, and Macklemore', 
    level: 'easy'},
    
    {quest: 'This is what the acronym AWS stands for', 
    answer: ['amazon web services'], 
    story: 'AWS is the world\'s number 1 cloud service provider, with customers like Netflix and Facebook', 
    level: 'easy'},
    
    {quest: 'In 2017, Amazon accquired this supermarket chain',
    answer: ['whole foods'],
    story: 'The purchase of Whole Foods marked Amazon\'s expansion into physical retail and the grocery business',
    level: 'easy'},
    
    {quest: 'Amazon released this popular e-reader, codenamed Fiona, in 2007',
    answer: ['kindle', 'amazon kindle', 'the kindle'],
    story: 'The name kindle, as in kindling a fire, is meant as a metaphor for reading and intellectual excitement',
    level: 'easy'}
];

var dataMedium = [ 
    {quest: 'Amazon was founded in this city',
    answer: ['bellevue', 'belvue'],
    story: 'Like many other tech startups, Amazon was founded in a garage, specifically Jeff Bezos\'s garage',
    level: 'medium'},

    {quest: 'Amazon\'s second headquarters are located in this state',
    answer: ['virginia'],
    story: 'Amazon plans to have 25,000 employees at HQ2 by 2030 and is partnering with Virginia Tech to support the development of high-tech talent',
    level: 'medium'},

    {quest: 'These 14 ideals guide Amazon\'s business decisions and culture',
    answer: ['leadership principles', 'leadership principle'],
    story: 'These 14 principles continue to evolve over time and embody Amazon\'s peculiar culture',
    level: 'medium'},

    {quest: 'It is said to always be this day at Amazon', 
    answer: ['day 1', '1', 'one'], 
    story: 'The Day 1 mentality means that Amazon treats every day like it\'s the first day of their new startup', 
    level: 'medium'},
    
    {quest: 'This is the name of a high tech supermarket that allows shoppers to skip checkout altogether', 
    answer: ['amazon go'], 
    story: 'Amazon Go stores are equipped with hundreds of sensors, keeping a virtual shopping cart so customers can just walk out when they\'re done shopping', 
    level: 'medium'},
    
    {quest: 'As a cost saving measure in the early days of Amazon, this was used as a desk', 
    answer: ['door', 'a door'], 
    story: 'Cheap doors and sawed off two by fours were used as desks to save money in the early days of Amazon. This mindset of frugality continues to this day', 
    level: 'medium'},
    
    {quest: 'At Amazon, teams are generally restricted to the amount of people that could be fed by blank', 
    answer: ['two pizzas', `2 pizzas`], 
    story: 'Project teams are generally capped around 10 people per team - or two pizza teams', 
    level: 'medium'}
];

var dataHard = [   
    {quest: 'In 2014, Amazon accquired this live streaming platform popular among the gaming community',
    answer: ['twitch'],
    story: 'Twitch is the World\'s leading live streaming platform for gamers',
    level: 'hard'},

    {quest: 'Amazon was initially named this', 
    answer: ['cadabra'], 
    story: 'Amazon was briefly named Cadabra, short for the magic term abracadabra', 
    level: 'hard'},
    
    {quest: 'This is the title of the first book ever sold on Amazon', 
    answer: ['fluid concepts and creative analogies', 'fluid concepts'], 
    story: 'Authored by Douglas Hofstadter, this book tackles the subject of artificial intelligence and machine learning', 
    level: 'hard'},
    
    {quest: 'Amazon.com originally launched with this tagline', 
    answer: ['earth\'s biggest book store', `earths biggest book store`], 
    story: 'Jeff Bezos chose the name Amazon to suggest scale, and something exotic and different', 
    level: 'hard'},

    {quest: 'This is the name of Amazon\'s mascot',
    answer: ['peccy', 'pecy'],
    story: 'This adorable, googley-eyed, orange creature is said to embody Amazon\'s peculiar ways',
    level: 'hard'}
];

const states = {
    START: `_START`,
    QUIZ: `_QUIZ`,
  };


/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    return (handlerInput.requestEnvelope.request.type === `LaunchRequest`);
  },
  handle(handlerInput) {
    const response = handlerInput.responseBuilder;
    //if (supportsDisplay(handlerInput)) {
     
      const pictureUrl = Util.getS3PreSignedUrl("Media/test.jpg");
    
    //}

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.counter = 0;
    handlerInput.attributesManager.setSessionAttributes(attributes);
    const speechText = welcomeMessage;
    return response
      .speak(speechText)
      .withStandardCard(`Intern Trivia`, welcomeMessage, pictureUrl)
      .reprompt(helpMessage)
      .getResponse();
  },
};


const QuizHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      console.log("Inside QuizHandler");
      console.log(JSON.stringify(request));
      return (request.type === "IntentRequest") &&
             (request.intent.name === "QuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
    },
    handle(handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const response = handlerInput.responseBuilder;
      const pictureUrl = Util.getS3PreSignedUrl("Media/jeff.jpg");
      var numPlayers = handlerInput.requestEnvelope.request.intent.slots.Number.value;

    //Make sure that numPlayers is bounded [1, maxPlayers]
      if (numPlayers < 1){
          numPlayers = 1;
      } else if (numPlayers > maxPlayers){
          numPlayers = maxPlayers;
      }
      

      attributes.state = states.QUIZ;
      

      //intialize scoring array for any number of players
      var quizScore = [];
      var i;
      for (i = 0; i < numPlayers; i++){
        quizScore.push(0);
      }

      attributes.quizScore = quizScore;
      attributes.round = 0;
      attributes.currTeam = 0;
      attributes.numPlayers = numPlayers;

      var speakOutput = startQuizMessage;

    //shuffle array for new teams and new question order each time
    dataEasy.sort(() => Math.random() - 0.5);
    dataMedium.sort(() => Math.random() - 0.5);
    dataHard.sort(() => Math.random() - 0.5);
    teamColors.sort(() => Math.random() - 0.5);

    //Generate reponse specific to num teams, use == to allow for type conversions
    if (numPlayers == 1){
        speakOutput += ``;
    } else if (numPlayers > 1){
        speakOutput += 'Team ' + teamColors[0] + ` will go first, followed by `;
        for (i = 1; i < numPlayers - 1; i++){
            speakOutput += teamColors[i] + `, `;
          }
          speakOutput += teamColors[i] + `. `;
    }

    var question = askQuestion(handlerInput);
    speakOutput += question;

    handlerInput.attributesManager.setSessionAttributes(attributes);
  
    return response.speak(speakOutput)
                    .withStandardCard(`Intern Trivia`, speakOutput, pictureUrl)
                    .reprompt(helpMessage)
                    .getResponse();
    },
  };

  const QuizAnswerHandler = {
    canHandle(handlerInput) {
      console.log("Inside QuizAnswerHandler");
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const request = handlerInput.requestEnvelope.request;
  
      return attributes.state === states.QUIZ &&
      (attributes.counter <= (numRounds * attributes.numPlayers)) &&
             request.type === 'IntentRequest' &&
             request.intent.name === 'AnswerIntent';
    },
    handle(handlerInput) {
      console.log("Inside QuizAnswerHandler - handle");
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const response = handlerInput.responseBuilder;
      const pictureUrl = Util.getS3PreSignedUrl("Media/jeopardy.jpg");
  
      var speakOutput = ``;
      var repromptOutput = ``;

      const item = attributes.quizItem;

      //checking if answer matches any of acceptable answers
      var i;
      var isCorrect = false;
      for (i = 0; i < item.answer.length; i++){
        if (compareSlots(handlerInput.requestEnvelope.request.intent.slots, item.answer[i])) {
            isCorrect = true;
        }
      }
  
      if (isCorrect) {
        speakOutput = getSpeechCon(true);
        attributes.quizScore[attributes.currTeam] += (attributes.round * pointMultiplier);
        handlerInput.attributesManager.setSessionAttributes(attributes);
      } else {
        speakOutput = getSpeechCon(false);
        //only get answer if wrong
        speakOutput += getAnswer(item);
      }
      speakOutput += getStory(item);
      var question = ``;

      //question count is less than total number of needed questions, WE NEED TO ASK ANOTHER QUESTION.
      if (attributes.counter < (numRounds * attributes.numPlayers)) {
        question = askQuestion(handlerInput);

        speakOutput += question;
        repromptOutput = helpMessage;
  
        return response.speak(speakOutput)
        .reprompt(repromptOutput)
        .getResponse();
      }
      else {
        attributes.counter += 1;
        handlerInput.attributesManager.setSessionAttributes(attributes);
        speakOutput += getFinalScore(attributes);
        return response.speak(speakOutput)
        .withStandardCard(`Intern Trivia`, speakOutput, pictureUrl)
        .reprompt(repromptOutput)
        .getResponse();
      }
    },
  };

  const LeaderboardHandler = {
    canHandle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && (attributes.counter == ((numRounds * attributes.numPlayers) + 1)) && request.intent.name === 'LeaderboardIntent';
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const pictureUrl = Util.getS3PreSignedUrl("Media/jeopardy.jpg");
        var leaderName = handlerInput.requestEnvelope.request.intent.slots.Name.value;
        var userid = getRandom(0, 500).toString();
        var place = 0;
        var recordCount = 0;
        var totalScore = 0;

        const postData = async (leaderName, highScore, userid) => {
            return new Promise((resolve, reject) => {
                base('Leaderboard').create(
                    [
                        {
                            fields: {
                                name: leaderName,
                                score: highScore,
                                id: userid,
                            },
                        },
                    ],
                    function (err, records) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        records.forEach(function (record) {
                            console.log(record.getId());
                        });
                        resolve({ success: true });
                    },
                );
            });
        };

        const getAverage = async (recordCount, totalScore, userid, place, leaderName) => {
            return new Promise((resolve, reject) => {
                base('Leaderboard')
                    .select({
                        // Selecting the first 100 records in Grid view:
                        maxRecords: 100,
                        view: 'Grid view',
                        fields: ['name', 'score', `id`],
                    })
                    .eachPage(
                        function page(records, fetchNextPage) {
                            // This function (`page`) will get called for each page of records.

                            records.forEach(function (record) {
                                recordCount++;
                                totalScore += record.get(`score`);

                                if (record.get(`id`) === userid) {
                                    place = recordCount;
                                }
                            });
                            // To fetch the next page of records, call `fetchNextPage`.
                            // If there are more records, `page` will get called again.
                            // If there are no more records, `done` will get called.
                            fetchNextPage();

                            var avgScore = Math.round(totalScore / recordCount);

                            resolve(
                              
                                `Posting your score to the leaderboard, ` +
                                    leaderName +
                                    `. You're in ` +
                                    place.toString() +
                                    `th place. The average score is ` +
                                    avgScore.toString(),
                            );
                        },
                        function done(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                        },
                    );
            });
        };

        //Posting to leaderboard
        const success = await postData(leaderName, highScore, userid);
    
        const speechText = await getAverage(recordCount, totalScore, userid, place, leaderName);

        return handlerInput.responseBuilder.speak(speechText).withStandardCard(`Intern Trivia`, speechText, pictureUrl).getResponse();
    },
};
  

  const ExitHandler = {
    canHandle(handlerInput) {
      console.log("Inside ExitHandler");
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const request = handlerInput.requestEnvelope.request;
  
      return request.type === `IntentRequest` && (
                request.intent.name === 'AMAZON.StopIntent' ||
                request.intent.name === 'AMAZON.PauseIntent' ||
                request.intent.name === 'AMAZON.CancelIntent'
             );
    },
    handle(handlerInput) {
      return handlerInput.responseBuilder
        .speak(exitSkillMessage)
        .getResponse();
    },
  };

  const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
      console.log("Inside SessionEndedRequestHandler");
      return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
      return handlerInput.responseBuilder.getResponse();
    },
  };

  const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      var output = ``;
      if (attributes.counter == 0){
        output = helpMessageNum;
      }else if ((attributes.counter <= (numRounds * attributes.numPlayers))){
        output = helpMessage;
      } else if (attributes.counter == ((numRounds * attributes.numPlayers) + 1)){
        output = helpMessageName;
      } else {
        output = errorMessage;
      }
  
      return handlerInput.responseBuilder
        .speak(output)
        .reprompt(output)
        .getResponse();
    },
  };

  function supportsDisplay(handlerInput) {
    var hasDisplay =
      handlerInput.requestEnvelope.context &&
      handlerInput.requestEnvelope.context.System &&
      handlerInput.requestEnvelope.context.System.device &&
      handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
      handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
    return hasDisplay;
  }


  function compareSlots(slots, value) {
    for (const slot in slots) {
      if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
        if (slots[slot].value.toString().toLowerCase() === value.toString().toLowerCase()) {
          return true;
        }
      }
    }
  
    return false;
  }

  function askQuestion(handlerInput) {
    console.log("I am in askQuestion()");
    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    //GENERATING THE QUESTION FROM DATA
    //const item = data[attributes.counter];
    var question = ``;

    //update round
    if(attributes.counter % attributes.numPlayers == 0){
        attributes.round += 1; 
        //only announce round after first round, only announce points change on first round
        if (attributes.round == 2) {
        question += `Onto round ` + attributes.round + `. The questions are harder and worth more points! `
        }else if (attributes.round > 2){
        question += `Onto round ` + attributes.round + `. `
        }
    } 

    //update currTeam
    attributes.currTeam = attributes.counter % attributes.numPlayers;

    //SET QUESTION DATA TO ATTRIBUTES
    var item;
    if (attributes.round == 1){
        item = dataEasy[attributes.currTeam];
    } else if (attributes.round == 2){
        item = dataMedium[attributes.currTeam];
    } else {
        item = dataHard[attributes.currTeam];
    }

    attributes.quizItem = item;

    //update counter
    attributes.counter += 1;
  
    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

    //disregard teams colors if just one person
  if (attributes.numPlayers > 1){
    question += teamColors[attributes.currTeam] + ` team, here is your ` + attributes.round + `th clue: `
    question += getQuestion(item);
  } else {
    question = `Here is your ` + attributes.round + `th clue: `
    question += getQuestion(item);
  }
    return question;
  }

  function getQuestion(item) {
    return `${item.quest}. `;
  }

  function getAnswer(item) {
        return `The correct answer is ${item.answer[0]}. `;
  }

  function getStory(item) {
    return `${item.story}. `;
  }

  function getFinalScore(attributes) {
    //finding winners first
    var i;
    var winners = ``;
    for (i = 0; i < attributes.numPlayers; i++) {
        //found higher score, reset winner array
    if(attributes.quizScore[i] > highScore){
        winners = ``;
        winners += teamColors[i];
        highScore = attributes.quizScore[i];
        //found tie, add winner
    }else if (attributes.quizScore[i] == highScore) {
        winners += ` and ` + teamColors[i];
    }
    }

    //making winner string
    var response = '';
    if(attributes.numPlayers == 1){
        response = `The results are in. You scored ` + highScore + ` points. Great job, let's put that on the leaderboard! What's your name?`;
    }else{
        response = `The results are in. ` + winners + ` won with ` + highScore + ` points. Great job everyone, let's put that on the leaderboard! ` + winners + `, what is your team name?`;
    }

    return response;
  }

  function getSpeechCon(type) {
    if (type) return `<say-as interpret-as='interjection'>${speechConsCorrect[getRandom(0, speechConsCorrect.length - 1)]}! </say-as><break strength='strong'/>`;
    return `<say-as interpret-as='interjection'>${speechConsWrong[getRandom(0, speechConsWrong.length - 1)]}. </say-as><break strength='strong'/>`;
  }


  function getRandom(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }

/* LAMBDA SETUP */
//general flow: skill in invoked, asks how many people, starts asking questions until round limit is reached and then ends
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    QuizHandler,
    QuizAnswerHandler,
    LeaderboardHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

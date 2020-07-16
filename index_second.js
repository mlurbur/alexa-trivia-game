const Alexa = require('ask-sdk-core');

const welcomeMessage = `Welcome to the Amazon intern jeopardy game! How many people are playing? `;
const startQuizMessage = `Let's get started! `;
const exitSkillMessage = `Thank you for playing! Come back again soon for new questions! `;
const helpMessage = `I'm not sure about that, sorry. `;
const numRounds = 2;

/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.custom();
const teamColors = [`green`, `blue`, `purple`, `orange`]
const data = [
  {quest: `This person founded Amazon.com`, answer: `jeff bezos`, story: ``},
  {quest: `It is said to always be this day at Amazon`, answer: `day 1`, story: ``},
  {quest: `He is the CEO of Amazon's cloud computing business, Amazon Web Services`, answer: `andy jassy`, story: ``},
  {quest: `This bear is best`, answer: `black bear`, story: ``},
  {quest: `This is Ron Swanson's favorite form of alchohol`, answer: `whiskey`, story: `1`},
  {quest: `This is Ron Swanson's favorite form of alchohol`, answer: `whiskey`, story: `2`},
  {quest: `This is Ron Swanson's favorite form of alchohol`, answer: `whiskey`, story: `3`}
];

const states = {
    START: `_START`,
    QUIZ: `_QUIZ`,
  };


/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const speechText = welcomeMessage
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(helpMessage)
      .getResponse();
  },
};


const QuizHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      console.log("Inside QuizHandler");
      console.log(JSON.stringify(request));
      return request.type === "IntentRequest" &&
             (request.intent.name === "QuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
    },
    handle(handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const response = handlerInput.responseBuilder;
      const numPlayers = handlerInput.requestEnvelope.request.intent.slots.Number.value;
      

      attributes.state = states.QUIZ;
      attributes.counter = 0;
      attributes.quizScore = [0,0,0,0];
      attributes.round = 0;
      attributes.currTeam = 0;
      attributes.numPlayers = numPlayers;

      var speakOutput = startQuizMessage;

    //Generate reponse specific to num teams, use == to allow for type conversions
    if (numPlayers == 1){
        speakOutput += ``;
    } else if (numPlayers == 2){
        speakOutput += 'Team ' + teamColors[0] + ` will go first, followed by ` + teamColors[1] + ` . `;
    } else if (numPlayers == 3){
        speakOutput += 'Team ' + teamColors[0] + ` will go first, followed by ` + teamColors[1] + `, ` + teamColors[2] + ` . `;
    } else {
        speakOutput += 'Team ' + teamColors[0] + ` will go first, followed by ` + teamColors[1] + `, ` + teamColors[2] + `, `+ teamColors[3] + ` . `;
    }

    var question = askQuestion(handlerInput);
    speakOutput += question;

    var repromptOutput = question;
  
    return response.speak(speakOutput)
                    .reprompt(repromptOutput)
                    .getResponse();
    },
  };

  const QuizAnswerHandler = {
    canHandle(handlerInput) {
      console.log("Inside QuizAnswerHandler");
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const request = handlerInput.requestEnvelope.request;
  
      return attributes.state === states.QUIZ &&
             request.type === 'IntentRequest' &&
             request.intent.name === 'AnswerIntent';
    },
    handle(handlerInput) {
      console.log("Inside QuizAnswerHandler - handle");
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const response = handlerInput.responseBuilder;
  
      var speakOutput = ``;
      var repromptOutput = ``;

      const item = attributes.quizItem;
      const property = attributes.quizProperty;
      const isCorrect = compareSlots(handlerInput.requestEnvelope.request.intent.slots, item.answer);
  
      if (isCorrect) {
        speakOutput = `Nice! `;
        attributes.quizScore[attributes.currTeam] += 1;
        handlerInput.attributesManager.setSessionAttributes(attributes);
      } else {
        speakOutput = `Darn. `;
      }
  
      speakOutput += getAnswer(item);
      speakOutput += getStory(item);
      var question = ``;
      //question count is less than total number of needed questions, WE NEED TO ASK ANOTHER QUESTION.
      if (attributes.counter < (numRounds * attributes.numPlayers)) {
        question = askQuestion(handlerInput);

        speakOutput += question;
        repromptOutput = question;
  
        return response.speak(speakOutput)
        .reprompt(repromptOutput)
        .getResponse();
      }
      else {
        speakOutput += getFinalScore(attributes);
        return response.speak(speakOutput).getResponse();
      }
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
      console.log("Inside ErrorHandler");
      return true;
    },
    handle(handlerInput, error) {
      console.log("Inside ErrorHandler - handle");
      console.log(`Error handled: ${JSON.stringify(error)}`);
      console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);
  
      return handlerInput.responseBuilder
        .speak(helpMessage)
        .reprompt(helpMessage)
        .getResponse();
    },
  };


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
    const item = data[attributes.counter];
    var question = ``;
  
    //SET QUESTION DATA TO ATTRIBUTES
    attributes.selectedItemIndex = attributes.counter;
    attributes.quizItem = item;

    //update round
    if(attributes.counter % attributes.numPlayers == 0){
        attributes.round += 1; 
        //only announce round after first round
        if (attributes.round >= 2) {
        question += `Onto round ` + attributes.round + `. The questions are harder and worth more points! `
        }
    } 

    //update currTeam
    attributes.currTeam = attributes.counter % attributes.numPlayers;

    //update counter
    attributes.counter += 1;
  
    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

    //disregard teams colors if just one person
  if (attributes.numPlayers > 1){
    question += teamColors[attributes.currTeam] + ` team, here is your ` + attributes.round + `th clue: `
    question += getQuestion(attributes.counter, item);
  } else {
    question = `Here is your ` + attributes.round + `th clue: `
    question += getQuestion(attributes.counter, item);
  }
    return question;
  }

  function getQuestion(counter, item) { 
    return `${item.quest}. `;
  }

  function getAnswer(item) {
        return `The correct answer is ${item.answer}. `;
  }

  function getStory(item) {
    return `Here's a little more information: ${item.story}. `;
  }

  function getFinalScore(attributes) {
    //finding winners first
    var i;
    var winners = ``;
    var topScore = 0;
    for (i = 0; i < attributes.numPlayers; i++) {
        //Something is wrong here, throws an error
        //found higher score, reset winner array
    if(attributes.quizScore[i] > topScore){
        winners = ``;
        winners += teamColors[i];
        topScore = attributes.quizScore[i];
        //found tie, add winner
    }else if (attributes.quizScore[i] == topScore) {
        winners += ` and ` + teamColors[i];
    }
    }

    //making winner string
    var response = '';
    if(attributes.numPlayers == 1){
        response = `You scored ` + topScore + `. Great job! Come back soon for more trivia!`
    }else{
        response = winners + ` won with ` + topScore + ` points. Great job everyone!`
    }

    return response;
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
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
const Alexa = require('ask-sdk-core');

const welcomeMessage = `Welcome to the Amazon intern jeopardy game! Would you like to play? `;
const startQuizMessage = `Let's get started! `;
const exitSkillMessage = `Thank you for playing! Come back again soon for new questions! `;
const helpMessage = `I'm not sure about that, sorry. `;

/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.custom();
const data = [
  {quest: `This person founded Amazon.com`, answer: `jeff bezos`, story: `Amazon was founded by Jeff Bezos in Bellevue, Washington, on July 5, 1994. The company started as an online marketplace for books but expanded to sell electronics, software, video games, apparel, furniture, food, toys, and jewelry. In 2015, Amazon surpassed Walmart as the most valuable retailer in the United States by market capitalization`},
  {quest: `It is said to always be this day at Amazon`, answer: `day 1`, story: `The Day 1 mentality means that even though Amazon is nearly 25 years old, the company treats every day like it’s the first day of their new startup`},
  {quest: `He is the CEO of Amazon's cloud computing business, Amazon Web Services`, answer: `andy jassy`, story: `In 1997, Jassy joined Amazon as a marketing manager. In 2003, Jassy founded Amazon Web Services, with a team of 57 people`},
  {quest: `This bear is best`, answer: `black bear`, story: `Bears, Beets, Battlestar Galactica`},
  {quest: `This is Ron Swanson's favorite form of alchohol`, answer: `whiskey`, story: ``}
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
    const speechText = getWelcomeMessage(sessionAttributes)
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
      console.log("Inside QuizHandler - handle");
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const response = handlerInput.responseBuilder;
      attributes.state = states.QUIZ;
      attributes.counter = 0;
      attributes.quizScore = 0;
  
      var question = askQuestion(handlerInput);
      var speakOutput = startQuizMessage + question;
      var repromptOutput = question;
  
      const item = attributes.quizItem;
      const property = attributes.quizProperty;
  
  
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
        attributes.quizScore += 1;
        handlerInput.attributesManager.setSessionAttributes(attributes);
      } else {
        speakOutput = `Darn. `;
      }
  
      speakOutput += getAnswer(item);
      speakOutput += getStory(item);
      var question = ``;
      //IF YOUR QUESTION COUNT IS LESS THAN 5, WE NEED TO ASK ANOTHER QUESTION.
      if (attributes.counter < 5) {
        speakOutput += getCurrentScore(attributes.quizScore, attributes.counter);
        question = askQuestion(handlerInput);
        speakOutput += question;
        repromptOutput = question;
        //attributes.profile.questAsked += 1;
  
        return response.speak(speakOutput)
        .reprompt(repromptOutput)
        .getResponse();
      }
      else {
        speakOutput += getFinalScore(attributes.quizScore, attributes.counter) + exitSkillMessage;
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

  /* RESPONSE INTERCEPTORS */

// This interceptor loads our profile from persistent storage into the session
// attributes.
const NewSessionRequestInterceptor = {
    async process(handlerInput) {
  
      if (handlerInput.requestEnvelope.session.new) {
        const attributesManager = handlerInput.attributesManager;
        let sessionAttributes = attributesManager.getSessionAttributes();
  
        const persistentAttributes = await attributesManager.getPersistentAttributes();
  
        if (!persistentAttributes.profile) {
          console.log('Initializing new profile...');
          sessionAttributes.isNew = true;
          sessionAttributes.profile = initializeProfile();
        } else {
          console.log('Restoring profile from persistent store.');
          sessionAttributes.isNew = false;
          sessionAttributes = persistentAttributes;
        }
        
        attributesManager.setSessionAttributes(sessionAttributes);
      }
    }
  };

  // This Response interceptor detects if the skill is going to exit and saves the
// session attributes into the persistent store.
const SessionWillEndInterceptor = {
    async process(handlerInput, responseOutput) {
  
      // let shouldEndSession = responseOutput.shouldEndSession;
      // shouldEndSession = (typeof shouldEndSession == "undefined" ? true : shouldEndSession);
      const requestType = handlerInput.requestEnvelope.request.type;
  
      const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession);
  
      console.log('responseOutput:', JSON.stringify(responseOutput));
  
      if(ses && !responseOutput.directives || requestType === 'SessionEndedRequest') {
  
      // if(shouldEndSession || requestType == 'SessionEndedRequest') {
        console.log('SessionWillEndInterceptor', 'end!');
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const persistentAttributes = await attributesManager.getPersistentAttributes();
        
        persistentAttributes.profile = sessionAttributes.profile;
  
        console.log(JSON.stringify(sessionAttributes));
  
        attributesManager.setPersistentAttributes(persistentAttributes);
        attributesManager.savePersistentAttributes(persistentAttributes);
      }
    }
  };

  function initializeProfile() {
    return {
        questAsked: 0
    };
  }

// gets the welcome message based upon the context of the skill.
function getWelcomeMessage(sessionAttributes) {

    let speechText = "";
  
    if (sessionAttributes.isNew) {
        speechText = welcomeMessage;
    } else {
        speechText = `Welcome back! Do you want to get started? `;
    }
    return speechText;
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

//   function compareSlots(slots, value) {
//     for (const slot in slots) {
//       if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
//             if (slotValue.toString().toLocaleLowerCase() === value.toString().toLocaleLowerCase()) {
//                 return true;
//             }
//       }
//     }
//     return false;
//   }

  function askQuestion(handlerInput) {
    console.log("I am in askQuestion()");
    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    //GENERATING THE RANDOM QUESTION FROM DATA
    const item = data[attributes.counter];
  
    //SET QUESTION DATA TO ATTRIBUTES
    attributes.selectedItemIndex = attributes.counter;
    attributes.quizItem = item;
    attributes.counter += 1;
  
    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);
  
    const question = getQuestion(attributes.counter, item);
    return question;
  }

  function getQuestion(counter, item) { 
    return `Here is your ${counter}th clue. ${item.quest}. `;
  }

  function getAnswer(item) {
        return `The correct answer is ${item.answer}. `;
  }

  function getStory(item) {
    return `Here's a little more information: ${item.story}. `;
  }

  function getCurrentScore(score, counter) {
    return `Your current score is ${score} out of ${counter}. `;
  }

  function getFinalScore(score, counter) {
    return `Your final score is ${score} out of ${counter}. `;
  }

  function getRandom(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }

/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    QuizHandler,
    QuizAnswerHandler,
    //RepeatHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
//   .addRequestInterceptors(NewSessionRequestInterceptor)
//   .addResponseInterceptors(SessionWillEndInterceptor)
//   .withTableName("triviaTable")
//   .withAutoCreateTable(true)
  .lambda();
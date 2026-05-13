const { getRequestType, getIntentName } = require('ask-sdk-core');
const { getAudioUrl, buildPlayDirective } = require('../util');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Retomando o som de chuva.';
    const url = getAudioUrl();

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDirective(buildPlayDirective(url, 'REPLACE_ALL'))
      .getResponse();
  }
};

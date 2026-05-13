const { getRequestType, getIntentName } = require('ask-sdk-core');
const { buildStopDirective } = require('../util');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (
        getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
        || getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
      );
  },
  handle(handlerInput) {
    const speakOutput = 'Som de chuva encerrado. Até logo!';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDirective(buildStopDirective())
      .withShouldEndSession(true)
      .getResponse();
  }
};

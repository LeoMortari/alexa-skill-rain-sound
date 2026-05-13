const { getRequestType, getIntentName } = require('ask-sdk-core');
const { buildStopDirective } = require('../util');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addDirective(buildStopDirective())
      .withShouldEndSession(true)
      .getResponse();
  }
};

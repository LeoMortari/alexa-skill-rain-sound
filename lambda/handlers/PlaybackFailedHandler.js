const { getRequestType } = require('ask-sdk-core');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFailed';
  },
  handle(handlerInput) {
    const error = handlerInput.requestEnvelope.request.error;
    console.log('AudioPlayer PlaybackFailed:', JSON.stringify(error, null, 2));
    return handlerInput.responseBuilder.getResponse();
  }
};

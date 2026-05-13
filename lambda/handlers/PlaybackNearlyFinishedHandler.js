const { getRequestType } = require('ask-sdk-core');
const { getAudioUrl, buildPlayDirective } = require('../util');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackNearlyFinished';
  },
  handle(handlerInput) {
    const url = getAudioUrl();

    return handlerInput.responseBuilder
      .addDirective(buildPlayDirective(url, 'ENQUEUE'))
      .getResponse();
  }
};

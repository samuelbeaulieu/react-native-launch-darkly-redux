import { initialize as ldClientInitialize } from 'launchdarkly-js-client-sdk';
import camelCase from 'lodash.camelcase';
import uuid from 'uuid';
import { setFlags as setFlagsAction } from './actions';

// initialise flags with default values in ld redux store
const initFlags = (flags, dispatch, useCamelCaseFlagKeys) => {
  const flagValues = { isLDReady: false };
  for (const flag in flags) {
    if (useCamelCaseFlagKeys) {
      const camelCasedKey = camelCase(flag);
      flagValues[camelCasedKey] = flags[flag];
    } else {
      flagValues[flag] = flags[flag];
    }
  }
  dispatch(setFlagsAction(flagValues));
};

// set flags with real values from ld server
const setFlags = (flags, dispatch, useCamelCaseFlagKeys) => {
  const flagValues = { isLDReady: true };
  for (const flag in flags) {
    const flagKey = useCamelCaseFlagKeys ? camelCase(flag) : flag;
    flagValues[flagKey] = ldClient.variation(flag, flags[flag]);
  }
  dispatch(setFlagsAction(flagValues));
};

const subscribeToChanges = (flags, dispatch, useCamelCaseFlagKeys) => {
  for (const flag in flags) {
    const flagKey = useCamelCaseFlagKeys ? camelCase(flag) : flag;
    ldClient.on(`change:${flag}`, current => {
      const newFlagValue = {};
      newFlagValue[flagKey] = current;
      dispatch(setFlagsAction(newFlagValue));
    });
  }
};

const initUser = () => {
  return {
    key: uuid.v4(),
    custom: {
      device: 'mobile',
    },
  };
};

export default ({ clientSideId, dispatch, flags, useCamelCaseFlagKeys = true, user, subscribe, options }) => {
  initFlags(flags, dispatch, useCamelCaseFlagKeys);

  // default subscribe to true
  const sanitisedSubscribe = typeof subscribe === 'undefined' ? true : subscribe;

  if (!user) {
    user = initUser();
  }

  window.ldClient = ldClientInitialize(clientSideId, user, options);
  window.ldClient.on('ready', () => {
    const flagsSanitised = flags || ldClient.allFlags();
    setFlags(flagsSanitised, dispatch, useCamelCaseFlagKeys);

    if (sanitisedSubscribe) {
      subscribeToChanges(flagsSanitised, dispatch, useCamelCaseFlagKeys);
    }
  });
};

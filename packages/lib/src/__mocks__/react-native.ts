export const Platform = {
    OS: 'ios',
    select: (obj: { ios?: unknown; default?: unknown }) => obj.ios || obj.default || {},
};

export const NativeModules = {};

export const Platform = {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.default || {},
};

export const NativeModules = {};

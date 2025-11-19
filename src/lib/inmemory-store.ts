export const signedUrlMap = new Map<string, object>();

let _storedPercyResults: any = null;

export const storedPercyResults = {
  get: () => _storedPercyResults,
  set: (value: any) => {
    _storedPercyResults = value;
  },
  clear: () => {
    _storedPercyResults = null;
  },
};

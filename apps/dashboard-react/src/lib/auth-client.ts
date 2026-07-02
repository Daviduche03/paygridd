function noop() {
  return Promise.resolve({ data: null, error: null });
}

const fakeMfa = {
  challenge: noop,
  verify: () => Promise.resolve({ data: { id: "fake" }, error: null }),
  enroll: () => Promise.resolve({ data: { id: "fake", type: "totp", totp: { qr_code: "fake", secret: "fake", uri: "fake" } }, error: null }),
  unenroll: noop,
  listFactors: () => Promise.resolve({ data: { all: [], totp: [] }, error: null }),
};

const client = {
  auth: {
    mfa: fakeMfa,
    getSession: () => Promise.resolve({
      data: { session: { access_token: "fake-token", user: null } },
      error: null,
    }),
    signInWithOtp: () => Promise.resolve({ data: null, error: null }),
    signOut: noop,
  },
  storage: {
    from: () => ({
      upload: noop,
      list: noop,
      download: noop,
      remove: noop,
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
};

export function createClient() {
  return client;
}

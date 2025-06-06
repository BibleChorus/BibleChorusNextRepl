if (typeof (Promise as any).withResolvers !== 'function') {
  (Promise as any).withResolvers = function withResolvers() {
    let resolve: (value?: any) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<any>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! } as any;
  };
}

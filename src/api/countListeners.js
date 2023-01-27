export const countListenersPerStream = (streamId) => {
  let count = 0;

  try {
    Object.values(global.listenersStack).forEach((pidData) => {
      count += pidData?.reduce(
        (ret, item) => (item.seg.id === streamId ? ret + 1 : ret),
        0
      );
    });
  } catch {}

  return count;
};

export default countListenersPerStream;

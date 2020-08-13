/**
 * @flow
 */

export default function preventDuplicate(handle: any, delay: number = 2000) {
  let time = 0;
  return () => {
    const currentTime = new Date().getTime();
    if (time < currentTime) {
      time = currentTime + delay;
      handle();
    }
  };
}

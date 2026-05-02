export const DEFAULT_SUCCESS_RATE = 0.9;
export const DEFAULT_SIMULATED_DELAY_MS = 500;

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isSuccess = (rate: number): boolean => Math.random() < rate;

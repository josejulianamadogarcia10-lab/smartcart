export const EXIT_AUTO_RETURN_SECONDS = 60
export const EXIT_REVIEW_AUTO_RETURN_SECONDS = 120

export function getExitAutoReturnSeconds(requiresCheck: boolean): number {
  return requiresCheck
    ? EXIT_REVIEW_AUTO_RETURN_SECONDS
    : EXIT_AUTO_RETURN_SECONDS
}

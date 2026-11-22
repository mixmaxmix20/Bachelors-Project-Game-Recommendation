export function getCollectionRatingChange(
  previousRating: number,
  rating: number,
) {
  return {
    totalRatings: rating - previousRating,
    ratingCount: Number(rating > 0) - Number(previousRating > 0),
  };
}

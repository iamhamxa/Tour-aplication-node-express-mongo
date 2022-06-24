// API FEATURES FILTERING SORT LIMITS ALGORITHMS
class APIFeatures {
  constructor(query, queryString) {
    // query moongose query pass
    // queryString req.query express query pass
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B) AdvanceFiltering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, (match) => `$${match}`);

    // BUILD QUERY
    this.query.find(JSON.parse(queryStr));
    return this;
  };

  // SORTING
  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort)
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('createdAt');
    };
    return this;
  };

  // Fields Limiting
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    };
    return this;
  };

  // PAGINATION
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  };
};
module.exports = APIFeatures;

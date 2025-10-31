db.grades.aggregate([
  {
    $unwind: "$scores",
  },
  {
    $group: {
      _id: "$class_id",
      average_score: {
        $avg: "$scores.score",
      },
    },
  },
  {
    $lookup: {
      from: "grades",
      pipeline: [
        {
          $unwind: "$scores",
        },
        {
          $group: {
            _id: null,
            overall_average: { $avg: "$scores.score" },
          },
        },
        {
          $project: {
            _id: 0,
            overall_average: { $round: ["$overall_average", 2] },
          },
        },
      ],
      as: "overall_average",
    },
  },
  {
    $project: {
      class_id: 1,
      average_score: { $round: ["$average_score", 2] },
      overall_average: {
        $arrayElemAt: ["$overall_average.overall_average", 0],
      },
    },
  },
  {
    $project: {
      _id: 0,
      class_id: "$_id",
      average_score: 1,
      comparison_to_overall_average: {
        $cond: {
          if: { $eq: ["$overall_average", "$average_score"] },
          then: "equal",
          else: {
            $cond: {
              if: { $lt: ["$average_score", "$overall_average"] },
              then: "below",
              else: "above",
            },
          },
        },
      },
    },
  },
]);


db.grades.aggregate([
  {
    $unwind: "$scores"
  },
  {
    $group: {
      _id: "$class_id",
      average_score: { $avg: "$scores.score" }
    }
  },
  {
    $lookup: {
      from: "grades",
      pipeline: [
        {
          $unwind: "$scores"
        },
        {
          $group: {
            _id: null,
            overall_average: {
              $avg: "$scores.score"
            }
          }
        }
      ],
      as: "overall_data"
    }
  },
  {
    $unwind: "$overall_data"
  },
  {
    $addFields: {
      comparison_to_overall_average: {
        $switch: {
          branches: [
            {
              case: {
                $gt: ["$average_score", "$overall_data.overall_average"]
              },
              then: "above"
            },
            {
              case: {
                $lt: ["$average_score", "$overall_data.overall_average"]
              },
              then: "below"
            }
          ],
          default: "equal"
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      class_id: "$_id",
      average_score: 1,
      comparison_to_overall_average: 1
    }
  },
  {
    $sort: {
      class_id: 1,
      average_score: -1
    }
  }
]);


db.grades.aggregate([
  {
    $unwind: "$scores",
  },
  {
    $group: {
      _id: "$class_id",
      average_score: { $avg: "$scores.score" },
    },
  },
  {
    $project: {
      _id: 0,
      class_id: "$_id",
      average_score: 1,
    },
  },
  {
    $lookup: {
      from: "grades",
      pipeline: [
        {
          $unwind: "$scores",
        },
        {
          $group: {
            _id: null,
            overall_average: { $avg: "$scores.score" },
          },
        },
        {
          $project: {
            _id: 0,
            overall_average: 1,
          },
        },
      ],
      as: "overall_average",
    },
  },
  {
    $unwind: "$overall_average",
  },
  {
    $project: {
      class_id: 1,
      average_score: 1,
      overall_average: "$overall_average.overall_average",
      comparison_to_overall_average: {
        $switch: {
          branches: [
            {
              case: {
                $gt: ["$average_score", "$overall_average.overall_average"],
              },
              then: "above",
            },
            {
              case: {
                $lt: ["$average_score", "$overall_average.overall_average"],
              },
              then: "below",
            },
          ],
          default: "equal",
        },
      },
    },
  },
  {
    $sort: {
      class_id: 1,
      average_score: -1,
    },
  },
]);

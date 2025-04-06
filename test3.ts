const start = [
  {
    workerIndex: 0,
    nanosecs: 529025102,
  },
  {
    workerIndex: 1,
    nanosecs: 678214550,
  },
  {
    workerIndex: 2,
    nanosecs: 820422088,
  },
  {
    workerIndex: 3,
    nanosecs: 947784779,
  },
  {
    workerIndex: 4,
    nanosecs: 1074678750,
  },
  {
    workerIndex: 5,
    nanosecs: 1202895866,
  },
  {
    workerIndex: 6,
    nanosecs: 1333568208,
  },
  {
    workerIndex: 7,
    nanosecs: 1465767182,
  },
  {
    workerIndex: 8,
    nanosecs: 1625144986,
  },
  {
    workerIndex: 9,
    nanosecs: 1824411868,
  },
  {
    workerIndex: 10,
    nanosecs: 1966225116,
  },
  {
    workerIndex: 11,
    nanosecs: 2132510528,
  },
  {
    workerIndex: 12,
    nanosecs: 2333097910,
  },
  {
    workerIndex: 13,
    nanosecs: 2514378695,
  },
  {
    workerIndex: 14,
    nanosecs: 2758640160,
  },
  {
    workerIndex: 15,
    nanosecs: 2990286426,
  },
];

const finish = [
  {
    workerIndex: 0,
    nanosecs: 10726564230,
  },
  {
    workerIndex: 1,
    nanosecs: 10875573696,
  },
  {
    workerIndex: 3,
    nanosecs: 11322532444,
  },
  {
    workerIndex: 4,
    nanosecs: 11423658467,
  },
  {
    workerIndex: 2,
    nanosecs: 11449750011,
  },
  {
    workerIndex: 5,
    nanosecs: 11608948475,
  },
  {
    workerIndex: 6,
    nanosecs: 11779244511,
  },
  {
    workerIndex: 8,
    nanosecs: 11974531099,
  },
  {
    workerIndex: 7,
    nanosecs: 12042879510,
  },
  {
    workerIndex: 10,
    nanosecs: 12333424418,
  },
  {
    workerIndex: 11,
    nanosecs: 12452143821,
  },
  {
    workerIndex: 9,
    nanosecs: 12463247456,
  },
  {
    workerIndex: 12,
    nanosecs: 12566162460,
  },
  {
    workerIndex: 13,
    nanosecs: 12715393909,
  },
  {
    workerIndex: 15,
    nanosecs: 12735019191,
  },
  {
    workerIndex: 14,
    nanosecs: 12846001578,
  },
];

start.sort((a, b) => a.workerIndex - b.workerIndex);
finish.sort((a, b) => a.workerIndex - b.workerIndex);

for (let index = 0; index < start.length; index++) {
  console.log(
    `Worker ${index}: ${
      (finish[index]!.nanosecs - start[index]!.nanosecs) / 1_000_000_000
    }`
  );
}

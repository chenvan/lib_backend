
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('user').del()
    .then(function () {
      // Inserts seed entries
      return knex('user').insert([
        {uid: '001960', name: '陈旺', password: '$2b$10$mSCLXZjjVKuQ.pfR2J0YxeiOIpomCq4xm1VbmwQX8nvj5dxz/XLMa'},
        {uid: '001961', name: '陈锐', password: '$2b$10$oKVxYtZITgB2QynOzdW9fOIdcW8/msJFOdhHm3twMeO6mwQxbBZD6'}
      ]);
    });
};

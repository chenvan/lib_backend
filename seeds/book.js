
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('book').del()
    .then(function () {
      // Inserts seed entries
      return knex('book').insert([
        {
          isbn: '9784063898002',
          title: '小嶋陽菜1stフォトブック こじはる',
          author: '小嶋 陽菜',
          cover_url: 'https://img1.doubanio.com/view/subject/s/public/s27169729.jpg',
          summary: '',
          type: '写真',
          total_number: '1',
          now_number: '1'
        },
        {
          isbn: '9787543898752',
          title: '无证之罪',
          author: '紫金陈',
          cover_url: 'https://img1.doubanio.com/view/subject/s/public/s29791969.jpg',
          summary: '',
          type: '小说',
          total_number: '1',
          now_number: '1'
        }
      ]);
    });
};

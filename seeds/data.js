
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('book').del()
    .then(function () {
      // Inserts seed entries
      return Promise.all([ 
        knex('book').returning('bid').insert([
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
        ]),
        knex('user').returning('uid').insert([
          {uid: '001960', name: '陈旺', password: '$2b$10$mSCLXZjjVKuQ.pfR2J0YxeiOIpomCq4xm1VbmwQX8nvj5dxz/XLMa'},
          {uid: '001961', name: '陈锐', password: '$2b$10$oKVxYtZITgB2QynOzdW9fOIdcW8/msJFOdhHm3twMeO6mwQxbBZD6'}
        ])
      ])
    })
    .then(([bidList, uidList]) => {
      let data = uidList.reduce((data, uid) => {
        bidList.forEach(bid => {
          data.push({uid, bid})
        })
        return data
      }, [])

      return Promise.all([
        knex('fav').insert(data),
        knex('history').insert(data),
        knex('borrowing').insert(data)
      ])
    })
}

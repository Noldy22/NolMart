CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    if (entry.get('collection') !== 'guides') {
      return entry;
    }

    return entry
      .get('data')
      .set('updatedAt', new Date().toISOString());
  },
});
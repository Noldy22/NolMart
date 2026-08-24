CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
  
      // Check which collection this entry belongs to
      if (entry.get('collection') !== 'guides') {
        return entry;
      }
  
      // Modify the actual content data
      return entry
        .get('data')
        .set('updatedAt', new Date().toISOString());
    },
  });
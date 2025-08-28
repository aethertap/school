class Inbox {
  random(n=10) {
    let dv = app.plugins.getPlugin('dataview').api;
    if(!dv) {
      throw new Error("Inbox.random: Dataview plugin isn't loaded!");
    }
    let inbox_items = dv.pages('#inbox').file.tasks
      .where(t=>(!t.completed) && t.text.match('#inbox'));
    return customJS.Mix.rand_subset(inbox_items,n);
  }
}

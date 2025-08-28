
class Todo {
  forDate(day,num_days=10) {
    let dv = app.plugins.getPlugin('dataview').api;
    if(!dv) {
      throw new Error("Inbox.random: Dataview plugin isn't loaded!");
    }
    const pages = dv.pages().file
      .where(f => !f.path.contains("school-")&&!f.path.contains("glass-waste-campaign")).tasks
      .where(t => !t.completed)
      .where(t => {
          // Have to add the "T00:00:00" here to make javascript parse the 
          // date in local timezone. Otherwise it parses it at UTC and then
          // alters it to be Local, which makes it off by one day.
          let date_str = t.text.match(/\[\[(\d\d\d\d-\d\d-\d\d)\]\]/);
          if(date_str) {
              let date = new Date(date_str[1]+"T00:00:00");
              let tomorrow = new Date(day);
              tomorrow.setDate(day.getDate()+1);
              let to_the_end = new Date(day);
              to_the_end.setDate(day.getDate()+num_days);
              if(date.valueOf() == day.valueOf()) {
                  t.visual = "***DUE day*** " + t.text;
              } else if(date.valueOf() == tomorrow.valueOf()) {
                  t.visual = "***DUE TOMORROW*** " + t.text;
              } else if(date.valueOf() < day.valueOf()) {
                  t.visual = "***PAST DUE*** " + t.text;
              }           
              return date.valueOf() < to_the_end.valueOf();
          }
          return false;
      })
      .sort(a => {
         let group_a = a.text.match(/\[\[([-0-9]+)\]\]/);
         console.log(`date match: ${group_a[1]}`);
         return group_a[1];
         },"asc");
    return pages;
  }
}

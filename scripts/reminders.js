class Reminders {
  forDate(day){
    if(!day instanceof Date) {
      throw new Error("Reminders.forDate requires a Date object");
    }

    let dv = app.plugins.getPlugin('dataview').api;
    if(!dv) {
      throw new Error("Reminders.fordate: Dataview plugin isn't loaded yet!")
    }

    let reminders = dv.pages("#remind").file.tasks
    .where(t => !t.completed)
    .where(t => {
      return (t.tags.includes("#remind/daily") 
        || (t.tags.includes("#remind/weekly")) && day.getDay().valueOf() == 0  
        || (t.tags.includes("#remind/monthly") && day.getDate().valueOf()< 7)
        || (t.tags.includes("#remind/quarterly") && [0,2,5,8].includes(day.getMonth().valueOf()) && day.getDate().valueOf()<7)
        || (t.tags.includes("#remind/yearly") && day.getMonth().valueOf() == 0 && day.getDate().valueOf() < 7))
    });
    return reminders;
  }
}

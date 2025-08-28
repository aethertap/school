
class Utils {
  /** Add leading zeros to the given number so that it comes out with the requested number of digits
 * @param num - The number to add zeros in front of
 * @param digits - How many digits we want to end up with
 */
  pad(num, digits) {
    return `0000000000${num}`.slice(-digits)
  }

  /** Return the date of the last time it was dayOfWeek (a number, Sunday is 0) *before* startingDate */
  getPreviousDay(dayOfWeek,startingDate=new Date()) {
    console.log(`utils.getPreviousDay(${dayOfWeek}, ${startingDate})`)
    const startingDay = startingDate.getDay();
    const previousDay = new Date(startingDate);
    if (startingDay === dayOfWeek) {
      previousDay.setDate(startingDate.getDate() - 7);
      return previousDay;
    }
    const subtract = startingDay > dayOfWeek ? startingDay - dayOfWeek : (7 - (dayOfWeek - startingDay));
    previousDay.setDate(startingDate.getDate() - subtract);
    return new Date(previousDay);
  }

  daysAfter(date,days) {
    if(!date instanceof Date){
      throw new Error("First arg to Utils.daysAfter must be a Date");
    }
    let d = new Date(date);
    d.setDate(date.getDate()+days);
    return d;
  }

  dateNext(dayname, from) { 
    let days = {
      'sun': 0, 'mon': 1, 'tue': 2,
      'wed': 3, 'thu': 4, 'fri': 5,
      'sat': 6
    };
    let dn = dayname.toLowerCase().slice(0,3);
    let offset = days[dn];
    if(typeof offset == 'undefined') {
      throw new Error(`Invalid day name: ${dayname}`);
    }
    let day = from ? from:new Date();
    day.setDate(day.getDate()+offset);
    return day
  }

  /** Given a YYYY-MM-DD date tag, create a Date object to use in date calculations
 * @param datestr - The string form of the date, in YYYY-MM-DD format
 */
  dateOfTag(datestr) {
    if(datestr instanceof Date) {
      return date;
    }
    let [y,m,d] = datestr.split('-').map((s) => parseInt(s));
    if(isNaN(y) || isNaN(m) || isNaN(d)) {
      throw new Error(`Can't parse the given date string: ${datestr} doesn't match YYYY-MM-DD required format`);
    }
    let date = new Date();
    date.setFullYear(y);
    date.setDate(d);
    date.setMonth(m-1);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
  }

  /** Given a Date object create a "YYYY-MM-DD" date tag
  * @param date- The Date object to convert.
  */
  tagOfDate(date) {
    if(date instanceof Date){
      return `${this.pad(date.getFullYear(),4)}-${this.pad(date.getMonth()+1,2)}-${this.pad(date.getDate(),2)}`;
    } else {
      let tag = JSON.stringify(date,0,2).slice(0,11);
      tag = tag.match(/\d\d\d\d-\d\d-\d\d/);
      if(tag && tag[0]) {
        return tag[0];
      }
    }
    throw new Error(`Can't make a date tag of non-Date object: ${JSON.stringify(date,0,2)}`);
  }

  /** Return a correctly-formatted assignment listitem (without the list decorators). This will replace an existing due date, and if a date is not given, it will erase any existing due date.
  * @param description - the text of the assignment. If it already has the hw tag and/or student name, they will not be added.
  * @param due_date - Either a Date or a string with the due date (undefined if there is no date)
  * @param whichkid - Optoinally, specify who gets the assignment (string that starts with 'e' for eliot, 'b' for briana, etc)
  */
  assignment(description,subject,due_date,whichkid){
    let kid = whichkid;
    if(typeof kid == 'string') {
      kid = {'b':'briana','e':'eliot'}[kid[0].toLowerCase()];
      if(kid == undefined) {
        throw new Error(`assignment: whichkid was not recognized: value was '${JSON.stringify(whichkid,0,2)}'`);
      }
    } else {
      if(kid !== undefined) {
        throw new Error(`assignment: whichkid must be either a string or undefined. Got '${JSON.stringify(whichkid,0,2)}'`);
      }
      kid = undefined;
    }
    if(due_date instanceof Date) {
      due_date = Utils.tagOfDate(due_date);
    } else if(!(typeof due_date == "string")) {
      throw new Error(`assignment: due_date must be either a string or a Date object: Got '${JSON.stringify(due_date,0,2)}'`);
    }

    let kidstr = kid ? `(${kid}) ` : '';
    let datestr = due_date? `[[${due_date}]]` : '';
    let subjstr = subject? `(${subject}) ` : '';

    description = description.replace(/\[\[[0-9]{4}-[0-9]{2}-[0-9]{2}\]\]$/,'');
    description = description.replace(/#hw/,'');
    description = description.replace(subjstr,'');
    description = description.replace(kidstr,'').trim();

    let result = `#hw ${subjstr}${kidstr}${description} ${datestr}`;
    return result;
  }

  /** Returns a dataview array obtained by getting all files with a "scheduled" attribute under the provided path, 
 * then filtering them down to the ones for which `filter` returns true.
 * @param basePath - A string containing the vault-absolute path to search under. 
 * @param filter - A function that will be provided with a Date as the first param and the dv.page as the second. It should return true if the entry should be retained.
 * 
*/
  scheduled(dv,basePath,filter) {
    if(typeof dv == 'string') {
      throw new Error("scheduled: Hey, you forgot that my first arg needs to be the dataview object!");
    }
    return dv.pages(`"${basePath}"`).where((p)=>p["scheduled"] && filter(dateOfTag(`${p["scheduled"]}`),p))
  }

  school_link(tp) {
    if(typeof tp == 'undefined') {
      throw new Error("school_link: Hey, you forgot that my first arg needs to be the templater object!");
    }
    return `[${tp.file.title}](https://school.ginosterous.com/${tp.file.path(true).replace(/\.md$/,'')})`
  }

  async date_picker() {
    let forms = app.plugins.getPlugin('modal-forms').api;
    if(!forms) {
      throw new Error("Utils.date_picker requires Modal Forms with a form named PickDate");
    }
    let data = (await forms.openForm('PickDate')).data;
    return data.date;
  }
  
  seven_day_items(today/*:Date*/,dv) {
    const pages = dv.pages().file
    .where(f => (f.tags.includes("#dad") || (!f.path.contains("school-spring-2024")&&!f.path.contains("glass-waste-campaign")))).tasks
    .where(t => !t.completed)
    .where(t => t.text.contains("#dad") || !t.text.contains("#hw"))
    .where(t => {
      // Have to add the "T00:00:00" here to make javascript parse the 
      // date in local timezone. Otherwise it parses it at UTC and then
      // alters it to be Local, which makes it off by one day.
      let date_str = t.text.match(/\[\[(\d\d\d\d-\d\d-\d\d)\]\]/);
      if(date_str) {
        let date = new Date(date_str[1]+"T00:00:00");
        let tomorrow = new Date(today);
        tomorrow.setDate(today.getDate()+1);
        let in_a_week = new Date(today);
        in_a_week.setDate(today.getDate()+7);
        if(date.valueOf() == today.valueOf()) {
          t.visual = "***DUE TODAY*** " + t.text;
        } else if(date.valueOf() == tomorrow.valueOf()) {
          t.visual = "***DUE TOMORROW*** " + t.text;
        } else if(date.valueOf() < today.valueOf()) {
          t.visual = "***PAST DUE*** " + t.text;
        }           
        return date.valueOf() < in_a_week.valueOf();
      }
      return false;
    })
    .sort(t => {
      let group = t.text.match(/\[\[([-0-9]+)\]\]/);
      return group[1];
    });
    if(pages.length) {
      dv.taskList(pages, false);
    } else {
      dv.paragraph("Nothing due within seven days.");
    }
  }

  lines(text){
    if(text) {
      return text.split(/[\r\n]+/)
        .map((s) => s.trim())
        .filter(s => s && s.length > 0);
    } else {
      return [];
    }
  }

  comma_sep(text) {
    if(text) {
      return text.split(/ *, */)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    } else {
      return [];
    }
  }
  aops_problem(text) {
    if(text) {
       return text.replaceAll(/\\color\[rgb\]{[^}]+}/g, '');
    } else {
      return '';
    }
  }
}


class School {
  /// Return a dataview array of all of the tasks whose due date falls between the two given dates
  /// that aren't already complete.
  school_tasks(end_date, start_date) {
    if(end_date instanceof Date) {
      end_date = customJS.Utils.tagOfDate(end_date);
    }
    if(start_date instanceof Date) {
      start_date = customJS.Utils.tagOfDate(start_date);
    } else {
      start_date = "1900-01-01";
    }
    let dv=app.plugins.getPlugin('dataview').api;
    return dv.pages('"projects/school-25-26"').file.tasks
      .where(t => !t.completed)
      .where(t => {
        let due = t.text.match(/(\d\d\d\d-\d\d-\d\d)/);
        if(due && due[1]) {
          if(((!end_date) || due[1]<=end_date) && ((!start_date )|| due[1] >= start_date))
            return t;
          else{
            return undefined;
          }
        } else {
          return undefined;
        }
      })
      .sort(a => {
         let group_a = a.text.match(/\[\[([-0-9]+)\]\]/);
         console.log(`date match: ${group_a[1]}`);
         return group_a[1];
      },"asc");
  }

  /// return the title, scheduled date, and sequence number of the last scheduled file under path.
  last_scheduled(class_path) {
    let dv = app.plugins.getPlugin('dataview').api;
    let files = dv.pages(`"${class_path}"`).file.where(f => f.frontmatter.scheduled).sort(f => f.frontmatter);
    if(files.length > 0) {
      let file = files.last();
      return {
        title: file.frontmatter.title,
        sequence: file.frontmatter.sequence || files.length,
        scheduled: file.frontmatter.scheduled,
      }
    } else {
      return {
        title: "",
        sequence: 0, 
        scheduled: undefined,
      }
    }
  }
  
  /// Return a dataview array of all incomplete tasks under the school folder that are tagged with '#dad'
  my_tasks(end_date,start_date) {
    return customJS.School.school_tasks(end_date,start_date)
      .where(t => t.tags.includes('#dad'));
  }

  homework_due(end_date,start_date) {
    return customJS.School.school_tasks(end_date,start_date)
      .where(t => t.tags.includes('#hw'));
  }

  // Return a data structure that can be passed to dataviewjs to build a table that has 
  // biology class title, lab, and scheduled date.
  bio_table() {
    let dv = app.plugins.getPlugin('dataview').api;
    if(!dv) {
      throw new Error("Dataview is requierd before calling School.bio_table()");
    }
    let lab_pages = Array.from(dv.pages('"projects/school-25-26/biology/labs"').file.where(f => f.frontmatter.scheduled).sort(f=>f.frontmatter.scheduled));
    let class_pages = Array.from(dv.pages('"projects/school-25-26/biology/lessons"').file.where(f => f.frontmatter.scheduled).sort(f=>f.frontmatter.scheduled));
    let headers=["Class Date", "Class name", "Lab Date", "Lab name"];
    let rows = [];
    let link = (file) => {
      if(!file) {
        return "";
      }
      let result = file.link;
      result.display = file.frontmatter&&file.frontmatter.title||"Untitled";
      return result;
    };
    let sch = (item) => item && item.frontmatter.scheduled;
    let i = 0;
    while(i < 100 && (lab_pages.length > 0 || class_pages.length > 0)) {
      i++;
      let cls = class_pages.shift();
      let lab = lab_pages.shift()
      let diff = (Date.parse(sch(lab)||"1900-01-01") - Date.parse(sch(cls)||"1900-01-01"));
      let day_ms = 24*60*60*1000;
      
      if(!lab) {
         rows.push([sch(cls) || "", link(cls),"",""]);
      } else if (!cls) {
        rows.push(["","",sch(lab)||"", link(lab)]);
      } else if(diff > day_ms * 2) { // no lab this week
        rows.push([sch(cls) || "", link(cls),"",""]);
        console.log(`NO LAB: class: ${sch(cls)}, lab: ${sch(lab)}, diff=${diff}`);
        if(lab) {
          lab_pages.unshift(lab);
        }
      } else if(!cls || diff < 0 ) { // no class this week
        rows.push(["","",sch(lab)||"", link(lab)]);
        console.log(`NO CLASS: class: ${sch(cls)}, lab: ${sch(lab)}, diff=${diff}`);
        if(cls) {
          class_pages.unshift(cls);
        }
      } else {
        console.log(`REGULAR: class: ${sch(cls)}, lab: ${sch(lab)}, diff=${diff}`);
        rows.push([ sch(cls) || "", link(cls), sch(lab) || "", link(lab) ]);
      }
    };
    return {headers: headers, rows: rows};
  }

  all_classes_week(start_date) {
    let utils = customJS.Utils;

    let last_monday = start_date;

    if (last_monday.getDay() != 1) {
      last_monday = utils.getPreviousDay(1, last_monday);
    }
    let dv=app.plugins.getPlugin("dataview").api;
    
    let start_tag = utils.tagOfDate(last_monday);
    let end_date = new Date(last_monday);
    end_date.setDate(last_monday.getDate() + 7);
    let end_tag = utils.tagOfDate(end_date);
    let all_classes = dv.pages('"projects/school-25-26"').file
      .where(f => {
        if (f.frontmatter.scheduled && !f.frontmatter.completed) {
          let when = utils.tagOfDate(f.frontmatter.scheduled);
          return (start_tag <= when && when < end_tag);
        }
        return false;
      });
    let by_day = [[], [], [], [], [], []];
    console.log(`${by_day}`);
    all_classes.forEach((sess) => {
      console.log(`session: ${sess}`);
      let day = utils.dateOfTag(sess.frontmatter.scheduled);
      by_day[day.getDay() - 1].push(dv.fileLink(sess.path, false, (sess.frontmatter.title || sess.name)));
    });
    // transpose the array
    let rows = [0, 1, 2, 3, 4, 5]
      .map(n => by_day.map(ls => ls[n]))
      .filter(ls => ls.filter(x => x).length > 0);
    let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
    let headers = [0,1,2,3,4]
      .map((n)=>{ let d = new Date(last_monday); d.setDate(last_monday.getDate()+n); return d})
      .map(d => {
        console.log(`checking date ${d}`);
        let brk = this.isDayOff(d);
        if(brk){
          console.log(`${d} is a break (${JSON.stringify(d)})-${JSON.stringify(brk)}`);
          return `${days[d.getDay()]} - ${brk.name}`;
        } else {
          return days[d.getDay()];
        }});
    return [headers,rows]
  }

  is_school_day(date) {
    return !this.isDayOff(date);
  }

  isDayOff(date) {
    if(typeof(date) == "string") {
      date = customJS.Utils.dateOfTag(date);
    }
    if(!(date instanceof Date)) {
      throw new Error(`Error: isDayOff needs a date or a date tag. Received "${typeof(date)}"`)
    }
    if(date.getDay() == 0 || date.getDay() == 6) {
      return {name:"Weekend"};
    }
    for(let brk of this.breaks()) {
      if(brk.starts<=date && brk.ends > date) {
        return brk
      }
    }
    return false;
  }

  breaks() {
    return [
      {
        name: "Summer break 25",
        starts: Date.parse("2025-06-01"),
        ends: Date.parse("2025-09-02")
      }, {
        name: "Fall break",
        starts:Date.parse("2025-10-16"),
        ends: Date.parse("2025-10-21")
      }, {
        name: "Thanksgiving",
        starts: Date.parse("2025-22-26"),
        ends: Date.parse("2025-12-01")
      }, {
        name: "Christmas",
        starts: Date.parse("2025-12-19"),
        ends: Date.parse("2026-01-06")
      }, {
        name: "No School",
        starts: Date.parse("2026-01-16"),
        ends: Date.parse("2026-01-17")
      }, {
        name: "MLK Day",
        starts: Date.parse("2026-01-19"),
        ends: Date.parse("2026-01-20")
      }, {
        name: "Midwinter break",
        starts: Date.parse("2026-02-12"),
        ends: Date.parse("2026-02-17")
      }, {
        name: "No School",
        starts: Date.parse("2026-03-20"),
        ends: Date.parse("2026-03-23")
      }, {
        name: "Spring Break",
        starts: Date.parse("2026-04-01"),
        ends: Date.parse("2026-04-08")
      }, {
        name: "Summer break 26",
        starts: Date.parse("2026-06-01"),
        ends: Date.parse("2026-09-02")
      }
    ]
  }

  dynamic_class(subject_code, path, title) {
    let dv = app.plugins.getPlugin("dataview").api;
    let num_classes = dv.pages(`"${path}"`).file.where(f => f.name.match(new RegExp(`${subject_code}-\\d\\d`))).length
    let slugtitle = title.replaceAll(/['"?\.!]/g, '').replaceAll(/[^a-zA-Z0-9_]+/g,'-').toLowerCase().replace(/^[ -_]+|[- _]+$/gm, '');
    let link = dv.fileLink(`${path}/${subject_code}-${("00"+(num_classes+1)).slice(-2)}-${slugtitle}`, false, `${title} (session ${num_classes+1})`);
    console.log(`Create dynamic link: ${link}`);
    return link
  }
}

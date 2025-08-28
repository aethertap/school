
class DueWithin {

    due_within_builder() {
        console.log("due within builder called");
        var obj = {
            _filter: "",
            _days: 7,
            _from_date: new Date()
        };
        obj.filter = (f) => {obj._filter = f; return obj};
        obj.days = (d) => {obj._days = d; return obj};
        obj.date = (d) => {
            if(d instanceof Date) {
                obj._from_date = d; 
            } else { // a string
                obj._from_date = new Date(d+"T00:00:00");
            }
            return obj
        };
        obj.search = () => coming_due(obj._filter, obj._days, obj._from_date);
        return(obj)
    }


    coming_due(filter, days, from_date) {
        const tp = app.plugins.plugins['templater-obsidian'].current_functions_object;
        const dv = app.plugins.plugins.dataview.api;
        var deadline = from_date;
        deadline.setDate(deadline.getDate()+7);

        return dv.pages(filter).file.tasks
            .where(t => !t.completed)
            .where(t => {
                const mch = t.text.match(/\[\[(\d\d\d\d-\d\d-\d\d)\]\]/);
                return mch && new Date(mch[1]+"T00:00:00").valueOf() < deadline.valueOf()
            })
            .map(t => `- [ ] ${t.link}: ${t.text}`)
            .join('\n')
    }
}

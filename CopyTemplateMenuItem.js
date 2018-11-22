Ext.define('Rally.ui.menu.item.CopyTemplate', {
    alias: 'widget.rallyrecordmenuitemcopytemplate',
    extend: 'Rally.ui.menu.item.RecordMenuItem',

    config: {

        handler: function() {
            const el = document.createElement('textarea');
            el.value = this.record.get('Value')
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            Rally.ui.notify.Notifier.show({ message: 'Template text copied to clipboard.' });
        },

        text: 'Copy Template Text'
    }
});


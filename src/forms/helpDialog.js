import {moduleData} from "../constants/moduleData";

class HelpDialog extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "Wild Magic Surge Help",
            template: `${moduleData.moduleFolder}/templates/help.html`,
            width: 600,
            closeOnSubmit: true
        });
    }

    getData() {
        // Any data to pass to the template can be added here
        return {};
    }

    activateListeners(html) {
        super.activateListeners(html);
        // Add any listeners if needed
    }

    _updateObject(event, formData) {
        // Handle form submission if needed
    }
}
export type FieldType =
  | "text"
  | "name"
  | "phone"
  | "date"
  | "time"
  | "number"
  | "select"
  | "signature";

export interface SmartFormField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface SmartFormSection {
  id: string;
  title: string;
  description?: string;
  fieldNames: string[];
}

export interface SmartFormSchema {
  id: string;
  title: string;
  fields: SmartFormField[];
  sections?: SmartFormSection[]; // optional grouping for static Card layout
}

export const weddingDetailsSchema: SmartFormSchema = {
  id: "weddingDetailsForm",
  title: "Wedding Details Sheet",
  sections: [
    { id: "general", title: "General & Coordinator", description: "Basic info and coordinator details", fieldNames: ["todays_date","final_numbers_date","coordinator","meeting_start_time","meeting_end_time"] },
    { id: "contacts", title: "Couple & Contacts", description: "Contact and address details", fieldNames: ["bride","groom","address","phone","contact_person","contact_person_phone"] },
    { id: "event", title: "Event Details", description: "Event date, time and counts", fieldNames: ["date_of_event","time_of_event","invite_time","adults","kids","vendors","total_people"] },
    { id: "timeline", title: "Timeline & Ceremony", description: "Timeline and ceremony specifics", fieldNames: ["timeline","site_time","additional_ready_room_time","bride_arrives","groom_arrives","ceremony_invites_say","extra_mics_for_ceremony","any_live_music_for_ch","sunset_time","bg_come_in_to_refresh","intros_dj_ends","dinner","cake_cutting","exit"] },
    { id: "bar", title: "Cocktails & Bar", description: "Appetizers and bar service", fieldNames: ["cocktail_appetizers_provided_by","cocktail_appetizer_location","cocktail_appetizer_setup_time","appetizer_type","cocktails_bar_ends","signed_bartending_contract","bartending_contract_for_how_many","bar_start_time","bar_hours_needed","bartenders_count","bars_count","bar_location","bar_notes"] },
    { id: "catering", title: "Catering", description: "Meal service and menus", fieldNames: ["edge_catering_package_plated","buffet_location","catering_start_time","menu","childrens_menu","vendors_eating","special_dietary_needs","menu_for_special_meals"] },
    { id: "linens", title: "Linens & Table Decor", description: "Tables, linens, and decor", fieldNames: ["linens","head_table_location","head_table_number","head_table_description","head_table_colors","chair_covers","linens_notes","guest_table_colors","napkin_color","napkin_fold","charger_plate_color","cake_knife_set","cake_table_colors","cake_table_notes","table_decorations","mirrors","votives_on_tables","votive_shape_color","decorations_initials_bride","decorations_initials_groom","assigned_seating","brides_family_reserved","grooms_family_reserved","reception_tables_count"] },
    { id: "logistics", title: "Items & Logistics", description: "AV and take-home items", fieldNames: ["video_or_slideshow","items_brought_in_by_bride_and_groom","packing_assign_person","items_return_list"] },
    { id: "childcare", title: "Childcare", description: "Children and supervision", fieldNames: ["childcare_num_under_8","childcare_location","childcare_adult_responsible","childcare_start_time"] },
    { id: "rehearsal", title: "Rehearsal & Day-Of", description: "Rehearsal and day-of timings", fieldNames: ["rehearsal_initials_bride","rehearsal_day_of_week","rehearsal_date","rehearsal_time","day_event_arrival_time_bride","day_event_arrival_time_groom","exclusive_use_start_time"] },
    { id: "favors", title: "Favors", description: "Favors and space needs", fieldNames: ["favors","favors_description"] },
    { id: "signatures", title: "Signatures", description: "Signature confirmations", fieldNames: ["signature_bride","signature_groom","signature_date","sb_coordinator_signature","sb_coordinator_signature_date"] }
  ],
  fields: [
    { name: "todays_date", label: "Today's Date", type: "date" },
    { name: "final_numbers_date", label: "Final #'s Date", type: "date" },
    { name: "coordinator", label: "Coordinator", type: "name" },
    { name: "meeting_start_time", label: "Meeting Start Time", type: "time" },
    { name: "meeting_end_time", label: "Meeting End Time", type: "time" },

    { name: "bride", label: "Bride", type: "name" },
    { name: "groom", label: "Groom", type: "name" },
    { name: "address", label: "Address", type: "text" },
    { name: "phone", label: "Phone #", type: "phone" },
    { name: "contact_person", label: "Contact Person", type: "name" },
    { name: "contact_person_phone", label: "Contact Person Phone", type: "phone" },

    { name: "date_of_event", label: "Date of Event", type: "date" },
    { name: "time_of_event", label: "Time of Event", type: "time" },
    { name: "invite_time", label: "Invite Time", type: "time" },
    { name: "adults", label: "Adults", type: "number" },
    { name: "kids", label: "Kids", type: "number" },
    { name: "vendors", label: "Vendors", type: "number" },
    { name: "total_people", label: "Total People", type: "number" },

    { name: "timeline", label: "Timeline", type: "text" },
    { name: "site_time", label: "Site Time", type: "time" },
    { name: "additional_ready_room_time", label: "Additional Ready Room Time", type: "time" },
    { name: "bride_arrives", label: "Bride Arrives", type: "time" },
    { name: "groom_arrives", label: "Groom Arrives", type: "time" },
    { name: "ceremony_invites_say", label: "Ceremony: Invites Say", type: "time" },
    { name: "extra_mics_for_ceremony", label: "Extra Mics for Ceremony", type: "number" },
    {
      name: "any_live_music_for_ch",
      label: "Any Live Music for C/H?",
      type: "select",
      options: ["Yes", "No"],
    },
    { name: "sunset_time", label: "Sunset Time", type: "time" },
    { name: "bg_come_in_to_refresh", label: "B/G Come in to Refresh", type: "time" },
    { name: "intros_dj_ends", label: "Intros: DJ Ends", type: "time" },
    { name: "dinner", label: "Dinner", type: "time" },
    { name: "cake_cutting", label: "Cake Cutting", type: "time" },
    { name: "exit", label: "Exit?", type: "time" },

    { name: "cocktail_appetizers_provided_by", label: "Cocktail Appetizers Provided By", type: "text" },
    { name: "cocktail_appetizer_location", label: "Appetizer Location", type: "text" },
    { name: "cocktail_appetizer_setup_time", label: "Appetizer Setup Time", type: "time" },
    { name: "appetizer_type", label: "Type of Appetizers", type: "text" },
    { name: "cocktails_bar_ends", label: "Cocktails: Bar Ends", type: "time" },
    {
      name: "signed_bartending_contract",
      label: "Signed Bartending Contract?",
      type: "select",
      options: ["Yes", "No"],
    },
    { name: "bartending_contract_for_how_many", label: "For How Many (Bar)?", type: "number" },
    { name: "bar_start_time", label: "Bar Start Time", type: "time" },
    { name: "bar_hours_needed", label: "Bar Hours Needed", type: "number" },
    { name: "bartenders_count", label: "# of Bartenders", type: "number" },
    { name: "bars_count", label: "# of Bars", type: "number" },
    { name: "bar_location", label: "Bar Location", type: "text" },
    { name: "bar_notes", label: "Bar Service Notes", type: "text" },

    { name: "edge_catering_package_plated", label: "Edge Catering Package Plated: Gold $4.50pp", type: "text" },
    { name: "buffet_location", label: "Buffet Location", type: "text" },
    { name: "catering_start_time", label: "Start Time (Buffet)", type: "time" },
    { name: "menu", label: "Menu", type: "text" },
    { name: "childrens_menu", label: "Children's Menu? (Tbd/Yes #/No)", type: "text" },
    { name: "vendors_eating", label: "# of Vendors eating?", type: "number" },
    { name: "special_dietary_needs", label: "Any special dietary needs?", type: "text" },
    { name: "menu_for_special_meals", label: "Menu for Special Meals", type: "text" },

    { name: "linens", label: "Linens", type: "text" },
    { name: "head_table_location", label: "Location of Head Table?", type: "text" },
    { name: "head_table_number", label: "# at Head Table?", type: "number" },
    { name: "head_table_description", label: "Descrpt. of H/T", type: "text" },
    { name: "head_table_colors", label: "Head Table Colors", type: "text" },
    { name: "chair_covers", label: "Chair Covers for Bride & Groom", type: "text" },
    { name: "linens_notes", label: "Notes (Linens)", type: "text" },
    { name: "guest_table_colors", label: "Guest Table Colors", type: "text" },
    { name: "napkin_color", label: "Napkin Color", type: "text" },
    { name: "napkin_fold", label: "Napkin Fold? (If cuff – how wide?)", type: "text" },
    { name: "charger_plate_color", label: "Charger Plate Color", type: "text" },
    {
      name: "cake_knife_set",
      label: "Use S/B cake knife set?",
      type: "select",
      options: ["Yes", "No"],
    },
    { name: "cake_table_colors", label: "Cake Table Colors", type: "text" },
    { name: "cake_table_notes", label: "Notes (Cake Table)", type: "text" },
    { name: "table_decorations", label: "Table Decorations", type: "text" },
    { name: "mirrors", label: "Mirrors? (Round or Square?)", type: "text" },
    { name: "votives_on_tables", label: "Votives on tables?", type: "text" },
    { name: "votive_shape_color", label: "Shape/Color of Votive?", type: "text" },
    { name: "decorations_initials_bride", label: "Initials (Bride) – Table Decorations", type: "text" },
    { name: "decorations_initials_groom", label: "Initials (Groom) – Table Decorations", type: "text" },
    {
      name: "assigned_seating",
      label: "Assigned Seating?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      name: "brides_family_reserved",
      label: "Reserved – Bride's Family?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      name: "grooms_family_reserved",
      label: "Reserved – Groom's Family?",
      type: "select",
      options: ["Yes", "No"],
    },
    { name: "reception_tables_count", label: "# of Reception Tables?", type: "number" },

    { name: "video_or_slideshow", label: "Video or Slide show?", type: "text" },
    { name: "items_brought_in_by_bride_and_groom", label: "Items being brought in by the Bride and Groom", type: "text" },
    { name: "packing_assign_person", label: "Person assigned to pack items in car", type: "text" },
    { name: "items_return_list", label: "Please provide SB staff list of items to return home", type: "text" },

    { name: "childcare_num_under_8", label: "# of children under 8?", type: "number" },
    { name: "childcare_location", label: "Located where? (Childcare)", type: "text" },
    { name: "childcare_adult_responsible", label: "Designated adult responsible?", type: "text" },
    { name: "childcare_start_time", label: "Childcare Start time?", type: "time" },

    { name: "rehearsal_initials_bride", label: "Initials (Bride) – Rehearsal", type: "text" },
    { name: "rehearsal_day_of_week", label: "Rehearsal Day of Week", type: "text" },
    { name: "rehearsal_date", label: "Rehearsal Date", type: "date" },
    { name: "rehearsal_time", label: "Rehearsal Time", type: "time" },
    { name: "day_event_arrival_time_bride", label: "Day of Event arrival time – Bride", type: "time" },
    { name: "day_event_arrival_time_groom", label: "Day of Event arrival time – Groom", type: "time" },
    { name: "exclusive_use_start_time", label: "Exclusive use of site begins at", type: "time" },

    { name: "favors", label: "Favors?", type: "select", options: ["Yes", "No"] },
    { name: "favors_description", label: "If yes, describe space needed", type: "text" },

    { name: "signature_bride", label: "Bride (Signature)", type: "signature" },
    { name: "signature_groom", label: "Groom (Signature)", type: "signature" },
    { name: "signature_date", label: "Date (Signatures)", type: "date" },
    { name: "sb_coordinator_signature", label: "Saguaro Buttes Wedding Coordinator (Signature)", type: "signature" },
    { name: "sb_coordinator_signature_date", label: "Saguaro Buttes Coord. Signature Date", type: "date" },
  ],
};

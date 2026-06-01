import { z } from 'zod';

// Schema for assigned vendor entries
const assignedVendorSchema = z.object({
  vendorId: z.string(),
  vendorType: z.string(),
  vendorName: z.string(),
});

export const formSchema = z.object({
  // Coordinator and Vendor Information
  from: z.string().min(1, "Coordinator name is required"),
  vendors: z.string().optional(), // Now optional since we have assignedVendors
  vendorType: z.string().min(1, "Type of vendor is required"),
  eventType: z.string().min(1, "Type of event is required"),
  customEventType: z.string().optional(),
  
  // Multi-vendor assignments
  assignedVendors: z.array(assignedVendorSchema).optional(),
  
  // Venue and Event Details
  venue: z.string().min(1, "Venue is required"),
  venueCode: z.string().optional(),
  weddingDate: z.date({ message: "Event date is required" }),
  eventStartTime: z.string().optional(),
  eventEndTime: z.string().optional(),
  setupTime: z.string().optional(),
  breakdownTime: z.string().optional(),
  
  // Contract and Package Information
  contract: z.string().optional(),
  packageType: z.string().optional(),
  clientSource: z.string().optional(),
  
  // Guest Information
  numberOfGuests: z.number().min(1, "Number of guests must be at least 1").optional(),
  expectedAttendance: z.number().optional(),
  
  // Wedding-specific fields
  brideName: z.string().optional(),
  groomName: z.string().optional(),
  bridePhone: z.string().optional(),
  groomPhone: z.string().optional(),
  brideEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  groomEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  
  // Wedding ceremony details
  ceremonyVenue: z.string().optional(),
  ceremonyTime: z.string().optional(),
  receptionVenue: z.string().optional(),
  receptionTime: z.string().optional(),
  rehearsalDate: z.date().optional(),
  rehearsalTime: z.string().optional(),
  
  // Quince fields
  quinceaneraName: z.string().optional(),
  quinceTheme: z.string().optional(),
  dressFitting: z.string().optional(),
  
  // Birthday/Quince shared fields
  parentName: z.string().optional(),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  
  // Birthday fields
  honoreeName: z.string().optional(),
  
  // Graduation fields
  graduateName: z.string().optional(),
  birthdayAge: z.number().optional(),
  partyTheme: z.string().optional(),
  
  // Banquet fields
  contactName: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  banquetPurpose: z.string().optional(),
  
  // Music and Entertainment
  musicGenrePreferences: z.string().optional(),
  specialSongs: z.string().optional(),
  doNotPlayList: z.string().optional(),
  announcements: z.string().optional(),
  microphoneNeeds: z.string().optional(),
  
  // Catering and Bar
  cateringStyle: z.string().optional(),
  mealService: z.string().optional(),
  barService: z.string().optional(),
  specialDietaryRequests: z.string().optional(),
  
  // Technical and Setup
  lightingRequests: z.string().optional(),
  soundRequests: z.string().optional(),
  equipmentNeeds: z.string().optional(),
  venueRestrictions: z.string().optional(),
  powerRequirements: z.string().optional(),
  
  // Photography and Videography
  photographyStyle: z.string().optional(),
  videographyRequests: z.string().optional(),
  specialMoments: z.string().optional(),
  
  // Transportation and Logistics
  parkingInformation: z.string().optional(),
  loadInInstructions: z.string().optional(),
  venueContact: z.string().optional(),
  emergencyContact: z.string().optional(),
  
  // Special Requests and Additional Information
  specialRequests: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  culturalConsiderations: z.string().optional(),
  timeline: z.string().optional(),
  additionalVendors: z.string().optional(),

  // Meeting and Timing Details
  todaysDate: z.date().optional(),
  meetingStartTime: z.string().optional(),
  meetingEndTime: z.string().optional(),
  finalFsDate: z.date().optional(),
  adults: z.number().optional(),
  kids: z.number().optional(),
  vendorsCount: z.number().optional(),
  totalPeople: z.number().optional(),
  inviteTime: z.string().optional(),
  address: z.string().optional(),
  ourDateOfRsvp: z.date().optional(),
  finalMeetingDate: z.date().optional(),

  // Ceremony Details
  numberOfBridesmaids: z.number().optional(),
  numberOfGroomsmen: z.number().optional(),
  numberOfFlowerGirls: z.number().optional(),
  numberOfRingBearers: z.number().optional(),
  whoCarryingRings: z.string().optional(),
  unityCeremonyType: z.string().optional(),
  guestBook: z.boolean().optional(),
  guestBookTable: z.string().optional(),
  sbCardBox: z.boolean().optional(),
  guestBookAttendant: z.string().optional(),
  officiant: z.string().optional(),
  photographerStartTime: z.string().optional(),
  floristArrivalTime: z.string().optional(),
  cakeProvidedBy: z.string().optional(),
  cakeCutNumber: z.string().optional(),
  cakeDeliveryTime: z.string().optional(),
  cakeTableLocation: z.string().optional(),

  // Cocktail Appetizers
  cocktailAppetizers: z.string().optional(),
  appetizerLocation: z.string().optional(),
  appetizerTimeOfSetup: z.string().optional(),
  appetizerType: z.string().optional(),

  // Childcare
  numberOfChildrenUnder8: z.number().optional(),
  childcareLocation: z.string().optional(),
  childcareAdultResponsible: z.string().optional(),
  childcareStartTime: z.string().optional(),

  // Edge Catering
  edgeCateringPackage: z.string().optional(),
  buffetLocation: z.string().optional(),
  cateringStartTime: z.string().optional(),
  cateringMenu: z.string().optional(),

  // Special Meals
  childrensMenu: z.string().optional(),
  numberOfVendorsEating: z.number().optional(),
  specialDietaryNeeds: z.string().optional(),
  menuForSpecialMeals: z.string().optional(),

  // Special Glassware
  champagneFlutesForToast: z.boolean().optional(),
  useOwnFlutes: z.boolean().optional(),
  wineGlassesOnTables: z.boolean().optional(),
  glasswareBehindBar: z.string().optional(),

  // Linens
  headTableLocation: z.string().optional(),
  numberAtHeadTable: z.number().optional(),
  headTableDescription: z.string().optional(),
  headTableColors: z.string().optional(),
  guestTableColors: z.string().optional(),
  chargerPlateColor: z.string().optional(),
  napkinColor: z.string().optional(),
  napkinFold: z.string().optional(),
  chiavariChairColor: z.string().optional(),
  chairCushions: z.string().optional(),
  cakeTableColors: z.string().optional(),
  useSbCakeKnifeSet: z.boolean().optional(),

  // Table Decorations
  centerpiecesHeadTable: z.string().optional(),
  mirrorsHeadTable: z.boolean().optional(),
  mirrorsHeadTableShape: z.string().optional(),
  votivesHeadTable: z.boolean().optional(),
  votiveShapeColorHeadTable: z.string().optional(),
  centerpiecesGuestTables: z.string().optional(),
  mirrorsGuestTables: z.string().optional(),
  votivesGuestTables: z.boolean().optional(),
  votiveShapeColorGuestTables: z.string().optional(),

  // Assigned Seating
  assignedSeating: z.boolean().optional(),
  seatingTableOrEasel: z.string().optional(),
  seatingLocation: z.string().optional(),
  usingTableNumbers: z.boolean().optional(),
  needSbHolders: z.boolean().optional(),
  bridesFamily: z.string().optional(),
  groomsFamily: z.string().optional(),
  numberOfReceptionTables: z.number().optional(),
  reservedFamilySeating: z.string().optional(),

  // Favors
  favors: z.boolean().optional(),
  favorsDescription: z.string().optional(),

  // Bartending Service
  barNoneContract: z.boolean().optional(),
  bartendingForHowMany: z.number().optional(),
  bartendingStartTime: z.string().optional(),
  bartendingHoursNeeded: z.number().optional(),
  numberOfBartenders: z.number().optional(),
  numberOfBars: z.number().optional(),
  locationOfBars: z.string().optional(),
  bartendingNotes: z.string().optional(),

  // Outside Decor
  outsideDecorFabric: z.string().optional(),
  rowMarkers: z.string().optional(),
  floristArchFlowers: z.boolean().optional(),

  // Marriage License & Rehearsal
  marriageLicenseInstructions: z.string().optional(),
  rehearsalDayOfWeek: z.string().optional(),
  weddingRehearsalDate: z.date().optional(),
  weddingRehearsalTime: z.string().optional(),
  dayOfEventBrideArrival: z.string().optional(),
  dayOfEventGroomArrival: z.string().optional(),
  additionalReadyRoomTime: z.string().optional(),

  // Items Brought by Couple
  itemsBroughtByCoupleList: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),

  // Music Details
  extraMicsForCeremony: z.boolean().optional(),
  liveMusicForCeremony: z.boolean().optional(),
  musicVideoOrDiscs: z.string().optional(),

  // Event Timeline
  timelineSiteTime: z.string().optional(),
  timelineStartTime: z.string().optional(),
  timelineDinner: z.string().optional(),
  timelineBar: z.string().optional(),
  timelineProgram: z.string().optional(),
  timelineOther: z.string().optional(),

  // Non-Wedding Specific Fields
  lobbySignIn: z.boolean().optional(),
  lobbySignInType: z.string().optional(),
  lobbyTableType: z.string().optional(),
  discJockey: z.string().optional(),
  djMeetingDate: z.date().optional(),
  djPhone: z.string().optional(),
  microphoneDuringEvent: z.boolean().optional(),
  whereToSetupStage: z.string().optional(),
  liveMusicSolosReadings: z.boolean().optional(),
  musicStandOrPodium: z.boolean().optional(),
  videoMontageSlideshow: z.boolean().optional(),
  videoPlayTime: z.string().optional(),
  videoDvdFormat: z.boolean().optional(),
  horsDeuvres: z.boolean().optional(),
  horsDeuvresProvidedBy: z.string().optional(),
  horsDeuvresTimeOfSetup: z.string().optional(),
  horsDeuvresType: z.string().optional(),
  contractedBar: z.boolean().optional(),
  beverageStationByEdge: z.boolean().optional(),
  headTableOnStage: z.boolean().optional(),
  reservedSeatingVip: z.boolean().optional(),
  reservedTableSize: z.string().optional(),
  
  // General fields
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
  wedding_id: z.string().optional(),
  assignedVendorId: z.string().uuid().optional(),
  
  // Payment type (how the client pays — mirrors bookingSource for UI clarity)
  payment_type: z.enum(['independent', 'venue_partner']).optional(),

  // Booking Type & Pricing (for differentiating venue partner vs independent gigs)
  bookingSource: z.enum(['venue_partner', 'independent']).optional(),
  pricingType: z.enum(['hourly', 'flat_rate']).optional(),
  hoursBooked: z.number().min(1).optional(),
  hourlyRate: z.number().min(0).optional(),
  totalPrice: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),

  // Dress Code
  dressCode: z.string().optional(),
  dressCodeCustom: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

export const defaultValues: FormData = {
  // Coordinator and Vendor Information
  from: "",
  vendors: "",
  vendorType: "",
  eventType: "",
  customEventType: "",
  assignedVendors: [],
  
  // Venue and Event Details
  venue: "",
  venueCode: "",
  weddingDate: new Date(),
  eventStartTime: "",
  eventEndTime: "",
  setupTime: "",
  breakdownTime: "",
  
  // Contract and Package Information
  contract: "",
  packageType: "",
  clientSource: "",
  
  // Guest Information
  numberOfGuests: undefined,
  expectedAttendance: undefined,
  
  // Wedding fields
  brideName: "",
  groomName: "",
  bridePhone: "",
  groomPhone: "",
  brideEmail: "",
  groomEmail: "",
  
  // Wedding ceremony details
  ceremonyVenue: "",
  ceremonyTime: "",
  receptionVenue: "",
  receptionTime: "",
  rehearsalTime: "",
  
  // Quince fields
  quinceaneraName: "",
  quinceTheme: "",
  dressFitting: "",
  
  // Birthday/Quince shared fields
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  
  // Birthday fields
  honoreeName: "",
  
  // Graduation fields
  graduateName: "",
  birthdayAge: undefined,
  partyTheme: "",
  
  // Banquet fields
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  banquetPurpose: "",
  
  // Music and Entertainment
  musicGenrePreferences: "",
  specialSongs: "",
  doNotPlayList: "",
  announcements: "",
  microphoneNeeds: "",
  
  // Catering and Bar
  cateringStyle: "",
  mealService: "",
  barService: "",
  specialDietaryRequests: "",
  
  // Technical and Setup
  lightingRequests: "",
  soundRequests: "",
  equipmentNeeds: "",
  venueRestrictions: "",
  powerRequirements: "",
  
  // Photography and Videography
  photographyStyle: "",
  videographyRequests: "",
  specialMoments: "",
  
  // Transportation and Logistics
  parkingInformation: "",
  loadInInstructions: "",
  venueContact: "",
  emergencyContact: "",
  
  // Special Requests and Additional Information
  specialRequests: "",
  accessibilityNeeds: "",
  culturalConsiderations: "",
  timeline: "",
  additionalVendors: "",

  // Meeting and Timing Details
  meetingStartTime: "",
  meetingEndTime: "",
  adults: undefined,
  kids: undefined,
  vendorsCount: undefined,
  totalPeople: undefined,
  inviteTime: "",
  address: "",

  // Ceremony Details
  numberOfBridesmaids: undefined,
  numberOfGroomsmen: undefined,
  numberOfFlowerGirls: undefined,
  numberOfRingBearers: undefined,
  whoCarryingRings: "",
  unityCeremonyType: "",
  guestBook: undefined,
  guestBookTable: "",
  sbCardBox: undefined,
  guestBookAttendant: "",
  officiant: "",
  photographerStartTime: "",
  floristArrivalTime: "",
  cakeProvidedBy: "",
  cakeCutNumber: "",
  cakeDeliveryTime: "",
  cakeTableLocation: "",

  // Cocktail Appetizers
  cocktailAppetizers: "",
  appetizerLocation: "",
  appetizerTimeOfSetup: "",
  appetizerType: "",

  // Childcare
  numberOfChildrenUnder8: undefined,
  childcareLocation: "",
  childcareAdultResponsible: "",
  childcareStartTime: "",

  // Edge Catering
  edgeCateringPackage: "",
  buffetLocation: "",
  cateringStartTime: "",
  cateringMenu: "",

  // Special Meals
  childrensMenu: "",
  numberOfVendorsEating: undefined,
  specialDietaryNeeds: "",
  menuForSpecialMeals: "",

  // Special Glassware
  champagneFlutesForToast: undefined,
  useOwnFlutes: undefined,
  wineGlassesOnTables: undefined,
  glasswareBehindBar: "",

  // Linens
  headTableLocation: "",
  numberAtHeadTable: undefined,
  headTableDescription: "",
  headTableColors: "",
  guestTableColors: "",
  chargerPlateColor: "",
  napkinColor: "",
  napkinFold: "",
  chiavariChairColor: "",
  chairCushions: "",
  cakeTableColors: "",
  useSbCakeKnifeSet: undefined,

  // Table Decorations
  centerpiecesHeadTable: "",
  mirrorsHeadTable: undefined,
  mirrorsHeadTableShape: "",
  votivesHeadTable: undefined,
  votiveShapeColorHeadTable: "",
  centerpiecesGuestTables: "",
  mirrorsGuestTables: "",
  votivesGuestTables: undefined,
  votiveShapeColorGuestTables: "",

  // Assigned Seating
  assignedSeating: undefined,
  seatingTableOrEasel: "",
  seatingLocation: "",
  usingTableNumbers: undefined,
  needSbHolders: undefined,
  bridesFamily: "",
  groomsFamily: "",
  numberOfReceptionTables: undefined,
  reservedFamilySeating: "",

  // Favors
  favors: undefined,
  favorsDescription: "",

  // Bartending Service
  barNoneContract: undefined,
  bartendingForHowMany: undefined,
  bartendingStartTime: "",
  bartendingHoursNeeded: undefined,
  numberOfBartenders: undefined,
  numberOfBars: undefined,
  locationOfBars: "",
  bartendingNotes: "",

  // Outside Decor
  outsideDecorFabric: "",
  rowMarkers: "",
  floristArchFlowers: undefined,

  // Marriage License & Rehearsal
  marriageLicenseInstructions: "",
  rehearsalDayOfWeek: "",
  weddingRehearsalTime: "",
  dayOfEventBrideArrival: "",
  dayOfEventGroomArrival: "",
  additionalReadyRoomTime: "",

  // Items Brought by Couple
  itemsBroughtByCoupleList: "",
  contactPersonName: "",
  contactPersonPhone: "",

  // Music Details
  extraMicsForCeremony: undefined,
  liveMusicForCeremony: undefined,
  musicVideoOrDiscs: "",

  // Event Timeline
  timelineSiteTime: "",
  timelineStartTime: "",
  timelineDinner: "",
  timelineBar: "",
  timelineProgram: "",
  timelineOther: "",

  // Non-Wedding Specific Fields
  lobbySignIn: undefined,
  lobbySignInType: "",
  lobbyTableType: "",
  discJockey: "",
  djPhone: "",
  microphoneDuringEvent: undefined,
  whereToSetupStage: "",
  liveMusicSolosReadings: undefined,
  musicStandOrPodium: undefined,
  videoMontageSlideshow: undefined,
  videoPlayTime: "",
  videoDvdFormat: undefined,
  horsDeuvres: undefined,
  horsDeuvresProvidedBy: "",
  horsDeuvresTimeOfSetup: "",
  horsDeuvresType: "",
  contractedBar: undefined,
  beverageStationByEdge: undefined,
  headTableOnStage: undefined,
  reservedSeatingVip: undefined,
  reservedTableSize: "",
  
  // General fields
  email: "",
  notes: "",
  wedding_id: "",
  assignedVendorId: undefined,
  
  // Payment type
  payment_type: 'independent' as const,

  // Booking Type & Pricing
  bookingSource: 'independent' as const,
  pricingType: undefined,
  hoursBooked: undefined,
  hourlyRate: undefined,
  totalPrice: undefined,
  depositAmount: undefined,

  // Dress Code
  dressCode: "",
  dressCodeCustom: "",
};
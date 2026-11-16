/*!
 * One Stop – Room Lights card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Everything is set from the visual card editor.
 */
(() => {
'use strict';
const VERSION = '1.6.0';
const TAG = 'one-stop-room-lights-card';
const EDITOR_TAG = TAG + '-editor';
const POPUP_TAG = 'one-stop-room-lights-popup';
const PICTURES = {"bathroom": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 25%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"112\" y=\"13\" width=\"96\" height=\"52\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 44%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"91\" y=\"75\" width=\"138\" height=\"26\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 49%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M105 76Q160 99 214 76\" fill=\"color-mix(in srgb,var(--room-accent) 80%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M160 75V63Q160 56 168 56Q176 56 176 63\" fill=\"none\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M160 83L160 99\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"151\" cy=\"90\" r=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"170\" cy=\"90\" r=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"41\" y=\"56\" width=\"24\" height=\"41\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 39%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M42 71L64 71\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><rect x=\"107\" y=\"10\" width=\"106\" height=\"5\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M114 17L114 60\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M94 103L225 103\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Ceiling &amp; vanity lighting</text></svg>", "bedroom": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 27%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"90\" y=\"25\" width=\"140\" height=\"53\" rx=\"12\" fill=\"color-mix(in srgb,var(--room-accent) 54%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"83\" y=\"54\" width=\"154\" height=\"43\" rx=\"9\" fill=\"color-mix(in srgb,var(--room-accent) 64%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"89\" y=\"58\" width=\"67\" height=\"18\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 82%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"164\" y=\"58\" width=\"67\" height=\"18\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 82%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M84 79H237V96H84Z\" fill=\"color-mix(in srgb,var(--room-accent) 68%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"44\" y=\"76\" width=\"30\" height=\"24\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 42%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"246\" y=\"76\" width=\"30\" height=\"24\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 42%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M59 59L59 75\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M261 59L261 75\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M45 58L49 39H69L73 58Z\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M247 58L251 39H271L275 58Z\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M96 100L225 100\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Bedside &amp; soft lighting</text></svg>", "office": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"53\" y=\"80\" width=\"218\" height=\"8\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 51%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M67 89L67 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M254 89L254 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"73\" y=\"18\" width=\"104\" height=\"47\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 35%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"185\" y=\"30\" width=\"54\" height=\"35\" rx=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 40%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M125 66L125 79\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M111 78L139 78\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M212 66L212 79\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"267\" y=\"60\" width=\"20\" height=\"42\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"277\" cy=\"70\" r=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 53%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M84 32L161 32\" stroke=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M84 40L136 40\" stroke=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M84 48L147 48\" stroke=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M62 90L263 90\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"77\" y=\"21\" width=\"96\" height=\"3\" rx=\"1\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M197 40L228 40\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Desk &amp; monitor lighting</text></svg>", "kitchen": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"34\" y=\"16\" width=\"42\" height=\"37\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 50%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"81\" y=\"16\" width=\"42\" height=\"37\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 50%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"128\" y=\"16\" width=\"42\" height=\"37\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 50%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M201 20H242L249 38H194Z\" fill=\"color-mix(in srgb,var(--room-accent) 47%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"27\" y=\"63\" width=\"265\" height=\"9\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 75%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 75%,#141414)\" stroke-width=\"1.5\"/><rect x=\"33\" y=\"73\" width=\"84\" height=\"30\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 43%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"121\" y=\"73\" width=\"86\" height=\"30\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 43%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"211\" y=\"73\" width=\"75\" height=\"30\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 43%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M75 74L75 101\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M164 74L164 101\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M153 62V49Q153 43 160 43Q168 43 168 51\" fill=\"none\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M139 63Q158 76 177 63\" fill=\"none\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"227\" cy=\"65\" r=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"251\" cy=\"65\" r=\"5\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><g class=\"art-lights\"><path d=\"M37 56L169 56\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M202 43L240 43\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Counters, sink &amp; stove</text></svg>", "living_room": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"30\" y=\"18\" width=\"60\" height=\"45\" rx=\"7\" fill=\"color-mix(in srgb,var(--room-accent) 31%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M60 19L60 62\" stroke=\"color-mix(in srgb,var(--room-accent) 58%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M31 40L89 40\" stroke=\"color-mix(in srgb,var(--room-accent) 58%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"111\" y=\"48\" width=\"123\" height=\"35\" rx=\"10\" fill=\"color-mix(in srgb,var(--room-accent) 39%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"103\" y=\"65\" width=\"140\" height=\"28\" rx=\"9\" fill=\"color-mix(in srgb,var(--room-accent) 48%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"111\" y=\"55\" width=\"56\" height=\"26\" rx=\"6\" fill=\"color-mix(in srgb,var(--room-accent) 57%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"169\" y=\"55\" width=\"56\" height=\"26\" rx=\"6\" fill=\"color-mix(in srgb,var(--room-accent) 57%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M115 94L115 102\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M231 94L231 102\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M269 54L269 101\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M256 102L282 102\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M253 51L259 29H279L285 51Z\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Lamps &amp; TV lighting</text></svg>", "hallway": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M25 15L111 36V103H25Z\" fill=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M295 15L209 36V103H295Z\" fill=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M111 36H209V103H111Z\" fill=\"color-mix(in srgb,var(--room-accent) 30%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M128 103L142 68H179L193 103Z\" fill=\"color-mix(in srgb,var(--room-accent) 48%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"47\" y=\"37\" width=\"32\" height=\"47\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 45%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"235\" y=\"40\" width=\"37\" height=\"34\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 38%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M44 85L84 85\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M242 76L242 98\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M268 76L268 98\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"244\" y=\"50\" width=\"7\" height=\"17\" rx=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 52%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"254\" y=\"55\" width=\"7\" height=\"12\" rx=\"1\" fill=\"color-mix(in srgb,var(--room-accent) 64%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><g class=\"art-lights\"><circle cx=\"145\" cy=\"21\" r=\"3\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"175\" cy=\"21\" r=\"3\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M239 76L270 76\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Hallway &amp; display lighting</text></svg>", "staircase": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M63 103V85H99V67H135V49H171V31H207V13H244V103Z\" fill=\"color-mix(in srgb,var(--room-accent) 48%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M57 79L224 4\" fill=\"none\" stroke=\"color-mix(in srgb,var(--room-accent) 76%,#141414)\" stroke-width=\"2.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M72 71L72 86\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M122 49L122 66\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M172 27L172 48\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M221 5L221 29\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><path d=\"M65 86L96 86\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M102 68L132 68\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M138 50L168 50\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M174 32L204 32\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Ceiling &amp; step lighting</text></svg>", "outside": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 23%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M70 36L160 5L250 36\" fill=\"color-mix(in srgb,var(--room-accent) 33%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 65%,#141414)\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"87\" y=\"37\" width=\"146\" height=\"65\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 40%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"135\" y=\"46\" width=\"50\" height=\"56\" rx=\"4\" fill=\"color-mix(in srgb,var(--room-accent) 53%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"173\" cy=\"76\" r=\"1.5\" fill=\"color-mix(in srgb,var(--room-accent) 70%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"97\" y=\"49\" width=\"21\" height=\"30\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 28%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"201\" y=\"49\" width=\"21\" height=\"30\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 28%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"43\" y=\"87\" width=\"24\" height=\"15\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 39%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M55 86Q29 66 44 58Q57 59 55 86Q71 61 78 72Q80 82 55 86\" fill=\"color-mix(in srgb,var(--room-accent) 51%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 68%,#141414)\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M91 104L229 104\" stroke=\"color-mix(in srgb,var(--room-accent) 53%,#141414)\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><g class=\"art-lights\"><rect x=\"76\" y=\"47\" width=\"7\" height=\"19\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><rect x=\"238\" y=\"47\" width=\"7\" height=\"19\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/><path d=\"M90 37L230 37\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Front &amp; back porch</text></svg>", "laundry": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 126\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><rect x=\"0\" y=\"0\" width=\"320\" height=\"126\" rx=\"15\" fill=\"color-mix(in srgb,var(--room-accent) 26%,#141414)\"/><path d=\"M22 104L298 104\" stroke=\"color-mix(in srgb,var(--room-accent) 37%,#141414)\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"61\" y=\"31\" width=\"98\" height=\"71\" rx=\"7\" fill=\"color-mix(in srgb,var(--room-accent) 60%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"66\" y=\"36\" width=\"88\" height=\"13\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 79%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"112\" cy=\"42\" r=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 47%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><circle cx=\"110\" cy=\"75\" r=\"22\" fill=\"color-mix(in srgb,var(--room-accent) 35%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 72%,#141414)\" stroke-width=\"1.5\"/><circle cx=\"110\" cy=\"75\" r=\"16\" fill=\"color-mix(in srgb,var(--room-accent) 47%,#141414)\" stroke=\"color-mix(in srgb,var(--room-accent) 57%,#141414)\" stroke-width=\"1.5\"/><rect x=\"185\" y=\"47\" width=\"80\" height=\"7\" rx=\"2\" fill=\"color-mix(in srgb,var(--room-accent) 55%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><path d=\"M194 55L194 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M255 55L255 103\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"195\" y=\"36\" width=\"56\" height=\"10\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 66%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"200\" y=\"25\" width=\"51\" height=\"10\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 61%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><rect x=\"209\" y=\"15\" width=\"42\" height=\"9\" rx=\"3\" fill=\"color-mix(in srgb,var(--room-accent) 71%,#141414)\" stroke=\"var(--art-line,color-mix(in srgb,var(--room-accent) 57%,#141414))\" stroke-width=\"1.5\"/><g class=\"art-lights\"><rect x=\"63\" y=\"14\" width=\"97\" height=\"4\" rx=\"2\" fill=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke=\"var(--art-light,color-mix(in srgb,var(--room-accent) 47%,#141414))\" stroke-width=\"1.5\"/></g><text x=\"298\" y=\"119\" text-anchor=\"end\" fill=\"color-mix(in srgb,var(--room-accent) 81%,#141414)\" font-family=\"Arial,sans-serif\" font-size=\"9.5\">Laundry room lighting</text></svg>"};
const PICTURE_NAMES = { auto: 'Match the room', kitchen: 'Kitchen', bedroom: 'Bedroom', bathroom: 'Bathroom', living_room: 'Living room', office: 'Office / computer room', hallway: 'Hallway', staircase: 'Staircase', outside: 'Outside / porch', laundry: 'Laundry room', none: 'No picture' };
const ICON_GUESS = [[/kitchen/,'mdi:stove'],[/bed/,'mdi:bed-king-outline'],[/bath|wash|powder|ensuite/,'mdi:shower'],[/living|family|lounge|great/,'mdi:sofa-outline'],[/office|computer|study|den/,'mdi:monitor-dashboard'],[/hall|entry|foyer/,'mdi:door-open'],[/stair/,'mdi:stairs'],[/out|porch|yard|garden|patio|deck|front|back/,'mdi:tree-outline'],[/laundry|utility|mud/,'mdi:washing-machine'],[/garage/,'mdi:garage'],[/dining/,'mdi:silverware-fork-knife'],[/basement/,'mdi:home-floor-b'],[/kid|nursery|play/,'mdi:teddy-bear']];
const PIC_GUESS = [[/kitchen/,'kitchen'],[/bed|nursery|kid/,'bedroom'],[/bath|wash|powder|ensuite/,'bathroom'],[/living|family|lounge|great|basement/,'living_room'],[/office|computer|study|den/,'office'],[/hall|entry|foyer/,'hallway'],[/stair/,'staircase'],[/out|porch|yard|garden|patio|deck|front|back|garage/,'outside'],[/laundry|utility|mud/,'laundry']];

const DEFAULTS = {
  picture: 'auto', tap: 'popup', hold: 'none',
  show_picture: true, show_icon: true, show_status: false, show_buttons: true, show_brightness: true, show_brightness_words: true, show_presets: true, show_wheel: true,
  button_position: 'auto', card_spacing: 'standard', corners: 'rounded', title_size: 'medium', font: 'classic', animations: true, haptics: true,
  off_background: 'theme', on_glow: 'normal', follow_light_colour: true, glow_mode: 'each', icon_color: 'lights', icon_background: true,
  button_size: 'large', button_shape: 'rounded', button_style: 'tinted', button_content: 'icon_words', button_text_size: 'medium', button_tint: 'soft',
  on_color: [35, 145, 86], off_color: [178, 52, 64], on_text: 'On', off_text: 'Off',
  on_icon: 'mdi:lightbulb-on', off_icon: 'mdi:lightbulb-off-outline',
  slider_style: 'bubble', slider_size: 'standard', slider_colour: 'lights',
  chip_shape: 'circle', chip_size: 'medium',
  preset_1: '2000', preset_2: '3500', preset_3: '5000', preset_4: '6500', colour_count: '0',
  picture_size: 'medium', picture_on_phones: false,
  wake_brightness: 50,
  no_master: 'all', rule_on: 'master', on_brightness: 'keep', on_brightness_pct: 100, on_white: 'keep',
  rule_off: 'all', rule_slider: 'on', rule_colour: 'on', rule_active: 'any',
  title_color: [247, 249, 252], hover_color: [184, 184, 184], off_custom_color: [40, 44, 52], icon_custom_color: [255, 196, 120],
  slider_custom_color: [255, 179, 107], colour_1: [255, 64, 64], colour_2: [64, 120, 255], colour_3: [180, 80, 255],
};
const PRESETS = { '2000': ['Candlelight', '#ff890e'], '2700': ['Warm white', '#ffa957'], '3000': ['Soft white', '#ffb46b'], '3500': ['Soft white', '#ffc18d'], '4000': ['Neutral white', '#ffd1a3'], '5000': ['Cool white', '#ffe4ce'], '6500': ['Daylight', '#fffefa'] };
const COLOUR_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'];
const NEUTRAL = [184, 184, 184];

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const titleCase = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const isOn = st => st && st.state === 'on';
const modesOf = st => st?.attributes?.supported_color_modes || [];
const dimmable = st => { const m = modesOf(st); return m.length ? m.some(x => x !== 'onoff') : st?.attributes?.brightness != null; };
const supportsTemp = st => modesOf(st).includes('color_temp') || st?.attributes?.min_color_temp_kelvin != null;
const supportsColour = st => modesOf(st).some(m => COLOUR_MODES.includes(m));
const isGroup = st => Array.isArray(st?.attributes?.entity_id);
function hueOf(csv) { const [r, g, b] = csv.split(',').map(n => n / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; }
function kelvinToRgb(k) {
  const t = Math.max(1000, Math.min(40000, k)) / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  return [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))));
}
function hsToRgb(h, s) {
  s /= 100; const f = n => { const k = (n + h / 60) % 6; return Math.round(255 * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return [f(5), f(3), f(1)];
}
function lightRgb(st) {
  const a = st.attributes || {};
  if (a.color_mode === 'color_temp' && a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  if (Array.isArray(a.rgb_color)) return a.rgb_color;
  if (Array.isArray(a.hs_color)) return hsToRgb(a.hs_color[0], a.hs_color[1]);
  if (a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  return [255, 196, 120];
}

/* Find the room's lights from Home Assistant's own Area assignments. */
function roomLights(hass, cfg) {
  const out = new Set();
  const ents = hass.entities || {}, devs = hass.devices || {};
  const hide = new Set(cfg.hide_lights || []);
  if (cfg.area) for (const [id, e] of Object.entries(ents)) {
    if (!id.startsWith('light.')) continue;
    if (e.entity_category || /_segment_\d+$/.test(id)) continue;
    const area = e.area_id || devs[e.device_id]?.area_id;
    if (area !== cfg.area) continue;
    const st = hass.states[id];
    if (!st || isGroup(st)) continue;
    out.add(id);
  }
  for (const id of cfg.extra_lights || []) if (hass.states[id]) out.add(id);
  for (const id of hide) out.delete(id);
  return [...out].sort((a, b) => (hass.states[a]?.attributes?.friendly_name || a).localeCompare(hass.states[b]?.attributes?.friendly_name || b));
}
/* Master lights: what turns on when the room is off. */
function masterLights(hass, cfg, members) {
  const picked = cfg.master_lights?.length ? cfg.master_lights : cfg.on_lights?.length ? cfg.on_lights : null;
  if (picked) return picked.filter(id => hass.states[id]);
  return cfg.no_master === 'hide' ? [] : members;
}
const onTargets = (hass, cfg, members) => masterLights(hass, cfg, members).filter(id => live(hass.states[id]));
const dimmableAll = (hass, ids) => ids.every(id => dimmable(hass.states[id]) || isGroup(hass.states[id]));
const ruleSet = (hass, cfg, members, rule) => (rule === 'master' ? masterLights(hass, cfg, members) : members).filter(id => live(hass.states[id]));


/* ---------------- shared house style (master edit) ----------------
 * Stored once per Home Assistant in a hidden dashboard, so every Room Lights card
 * (on any dashboard) follows it. Card-level settings still win. */
const STYLE_DASH = 'one-stop-cards';
const ROOM_KEYS = ['type', 'area', 'name', 'room_icon', 'master_lights', 'on_lights', 'extra_lights', 'hide_lights', 'picture', 'picture_url', 'picture_caption', 'tap', 'tap_page', 'hold', 'hold_page', 'hover_color'];
const Shared = {
  data: null, loading: null, listeners: new Set(), subscribed: false,
  get(hass) {
    if (this.data) return Promise.resolve(this.data);
    if (!this.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) this.data = c; } catch (e) {} }
    if (this.data && !this.loading) { this.loading = this._fetch(hass).then(d => { const changed = !same(d, this.data); this.data = d; this._cache(); this._subscribe(hass); if (changed) this.listeners.forEach(fn => fn(d)); return d; }); return Promise.resolve(this.data); }
    if (!this.loading) this.loading = this._fetch(hass).then(d => { this.data = d; this._cache(); this._subscribe(hass); return d; });
    return this.loading;
  },
  async _fetch(hass) {
    try { const cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); return cfg?.one_stop || {}; }
    catch (e) { return {}; }
  },
  _cache() { try { localStorage.setItem('one-stop-cards-style', JSON.stringify(this.data || {})); } catch (e) {} },
  _subscribe(hass) {
    if (this.subscribed || !hass?.connection) return; this.subscribed = true;
    hass.connection.subscribeEvents(async ev => {
      if (ev?.data?.url_path !== STYLE_DASH) return;
      this.data = await this._fetch(hass); this._cache(); this.listeners.forEach(fn => fn(this.data));
    }, 'lovelace_updated').catch(() => {});
  },
  async save(hass, section, values) {
    const list = await hass.callWS({ type: 'lovelace/dashboards/list' });
    if (!list.some(d => d.url_path === STYLE_DASH))
      await hass.callWS({ type: 'lovelace/dashboards/create', url_path: STYLE_DASH, title: 'One Stop Cards', icon: 'mdi:palette-swatch-outline', show_in_sidebar: false, require_admin: false, mode: 'storage' });
    let cfg; try { cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); } catch (e) { cfg = null; }
    cfg = cfg && cfg.views ? cfg : { views: [{ title: 'One Stop Cards', cards: [{ type: 'markdown', content: '## One Stop Cards\nShared styles for One Stop cards live here. Change them from any card’s editor with **Master edit** turned on.' }] }] };
    cfg.one_stop = { ...(cfg.one_stop || {}), [section]: values };
    await hass.callWS({ type: 'lovelace/config/save', url_path: STYLE_DASH, config: cfg });
    this.data = cfg.one_stop; this._cache(); this.listeners.forEach(fn => fn(this.data));
  },
};

/* ---------------- styles ---------------- */
const CARD_CSS = `
:host{display:block;--osl-rgb:184,184,184}
ha-card{position:relative;overflow:hidden;padding:var(--osl-pad,18px);border-radius:var(--osl-radius,22px);box-sizing:border-box;container:osl/inline-size;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--osl-off-bg);
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);
  backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);color:#f7f9fc;cursor:pointer;
  -webkit-tap-highlight-color:transparent;user-select:none;font-family:var(--osl-font)}
ha-card.on{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.035) 48%,rgba(255,255,255,.075)),
  linear-gradient(rgba(var(--osl-rgb),var(--osl-glow-a,.25)),rgba(var(--osl-rgb),var(--osl-glow-b,.12))),rgba(28,28,28,.62);
  border-color:rgba(var(--osl-rgb),var(--osl-glow-border,.34));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.16);
  backdrop-filter:blur(12px) saturate(1.15);-webkit-backdrop-filter:blur(12px) saturate(1.15)}
ha-card.on.multi{background:linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.03) 48%,rgba(255,255,255,.07)),var(--osl-multi),rgba(28,28,28,.62)}
.wrap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"i n p" "art art art" "m m m";column-gap:12px;row-gap:12px;align-items:center}
.wrap.noicon{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"n p" "art art" "m m"}
.icon{grid-area:i;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--osl-icon-bg,rgba(var(--osl-rgb),.10))}
.icon ha-icon{--mdc-icon-size:34px;color:var(--osl-icon-color,rgb(var(--osl-rgb)))}
ha-card.on.anim .icon ha-icon{animation:osl-breathe 3.2s ease-in-out infinite}
.head{grid-area:n;min-width:0;display:flex;flex-direction:column;gap:2px}
.name{font-weight:650;letter-spacing:-.4px;font-size:var(--osl-title,21px);line-height:1.2;color:var(--osl-title-color,#f7f9fc);overflow-wrap:anywhere}
.status{font-size:14px;line-height:18px;color:rgba(235,241,248,.78)}
.power{grid-area:p;display:flex;gap:8px;justify-content:flex-end}
.pbtn{all:unset;box-sizing:border-box;cursor:pointer;flex:0 0 auto;width:var(--osl-btn,80px);height:var(--osl-btn,80px);border-radius:var(--osl-btn-radius,14px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-weight:650;font-size:var(--osl-btn-text,14px);line-height:1.25;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1);transition:transform .12s ease,filter .12s ease;background:var(--b-bg);border:var(--b-border);color:var(--b-fg)}
.pbtn ha-icon{--mdc-icon-size:calc(var(--osl-btn,80px) * .42);color:var(--b-fg)}
.pbtn.icononly ha-icon{--mdc-icon-size:calc(var(--osl-btn,80px) * .5)} .pbtn.wordsonly{font-size:calc(var(--osl-btn-text,14px) * 1.25)}
.pbtn:active{transform:scale(.96)} .pbtn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.pbtn.on{--b-bg:var(--osl-on-bg);--b-border:var(--osl-on-border);--b-fg:var(--osl-on-fg,#f7f9fc)}
.pbtn.off{--b-bg:var(--osl-off-btn-bg);--b-border:var(--osl-off-border);--b-fg:var(--osl-off-fg,#f7f9fc)}
.pbtn[disabled]{opacity:.45;cursor:default}
.wrap.below{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"i n" "p p" "art art" "m m"}
.wrap.below.noicon{grid-template-columns:minmax(0,1fr);grid-template-areas:"n" "p" "art" "m"}
.wrap.below .pbtn{flex:1 1 0;height:min(var(--osl-btn,80px),76px)}
.art{grid-area:art;height:var(--osl-art-h,112px);border-radius:15px;overflow:hidden;pointer-events:none;--room-accent:rgb(var(--osl-rgb));--art-light:rgba(var(--osl-rgb),.95);--art-line:rgba(var(--osl-rgb),.7)}
ha-card.on .art{background:rgba(var(--osl-rgb),.06)} ha-card.on.anim .art .art-lights{animation:osl-art 3.6s ease-in-out infinite}
.art svg{display:block;width:100%;height:100%} .art img{display:block;width:100%;height:100%;object-fit:cover}
.master{grid-area:m;display:grid;grid-template-columns:repeat(var(--osl-chips,5),minmax(0,1fr));row-gap:10px;cursor:default}
.dim{grid-column:1/-1;display:flex;flex-direction:column;gap:2px}
.dimhead{display:flex;align-items:baseline;gap:7px;font-weight:600;font-size:16px;line-height:20px;color:#eef3fa}
.dimhead output{font-weight:650}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:var(--sl-h,56px);margin:0;background:transparent;cursor:pointer;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:var(--sl-t,12px);border-radius:999px;background:linear-gradient(90deg,var(--sl-c) var(--pct,0%),rgba(255,255,255,.16) var(--pct,0%))}
input[type=range]::-moz-range-track{height:var(--sl-t,12px);border-radius:999px;background:rgba(255,255,255,.16)}
input[type=range]::-moz-range-progress{height:var(--sl-t,12px);border-radius:999px;background:var(--sl-c)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:var(--sl-th,32px);height:var(--sl-th,32px);border-radius:50%;margin-top:calc((var(--sl-t,12px) - var(--sl-th,32px)) / 2);background:var(--sl-c);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)}
input[type=range]::-moz-range-thumb{width:calc(var(--sl-th,32px) - 6px);height:calc(var(--sl-th,32px) - 6px);border-radius:50%;background:var(--sl-c);border:3px solid #fff}
input[type=range]:disabled{opacity:.45;cursor:default}
.dim.bubble{position:relative;display:block;height:var(--sl-bh,56px);border-radius:var(--sl-br,18px);overflow:hidden;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.dim.bubble .bfill{position:absolute;inset:0 auto 0 0;width:var(--pct,0%);background:var(--osl-fill,var(--sl-c));opacity:.55;border-radius:inherit;transition:width .12s ease-out}
.dim.bubble .blabel{position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:0 18px;pointer-events:none;font-weight:600;font-size:16px;color:#f7f9fc;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.dim.bubble .blabel ha-icon{--mdc-icon-size:24px}
.dim.bubble .blabel .bpct{margin-left:auto;font-weight:650}
.dim.bubble input[type=range]{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize}
.dim.bubble.nowords .btext{display:none}
.dim.bubble:has(input:disabled){opacity:.45}
.chip{all:unset;box-sizing:border-box;justify-self:center;width:calc(var(--chip,40px) + 20px);max-width:100%;height:calc(var(--chip,40px) + 20px);border-radius:var(--chip-r,50%);display:flex;align-items:center;justify-content:center;cursor:pointer}
.chip span{width:var(--chip,40px);height:var(--chip,40px);border-radius:var(--chip-r,50%);box-shadow:0 0 0 1px rgba(255,255,255,.18),0 2px 6px rgba(0,0,0,.25)}
.chip:focus-visible{outline:2px solid #fff}
.chip.wheel span{background:conic-gradient(red,#ff0,lime,cyan,blue,#f0f,red)}
.chip:active{transform:scale(.95)} .chip[disabled]{opacity:.4;cursor:default}
.msg{grid-column:1/-1;font-size:13px;line-height:17px;color:#ffd7d7;min-height:0}
.msg:empty{display:none}
@media (hover:hover) and (pointer:fine){ha-card:hover{border-color:var(--osl-hover,rgba(var(--osl-rgb),.7))}}
@media (max-width:767px){.art:not(.phones){display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (prefers-reduced-transparency:reduce){ha-card{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgb(48,48,48)}}
@keyframes osl-breathe{0%,100%{transform:scale(1);opacity:.84}50%{transform:scale(1.055);opacity:1}}
@keyframes osl-art{0%,100%{opacity:.82}50%{opacity:1}}
.hide{display:none!important}
`;

/* ---------------- the card ---------------- */
class OneStopRoomLightsCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const areas = Object.values(hass?.areas || {});
    const a = areas.find(x => /kitchen/i.test(x.name)) || areas[0];
    return a ? { area: a.area_id } : {};
  }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = { ...config };
    this._merge();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._built = false;
    if (this._hass) this._render();
  }
  _merge() {
    if (!Shared.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) Shared.data = c; } catch (e) {} }
    this._cfg = { ...DEFAULTS, ...((Shared.data || {}).room_lights || {}), ...this._raw };
  }
  connectedCallback() {
    this._onShared = () => { const before = JSON.stringify(this._cfg); this._merge(); if (JSON.stringify(this._cfg) === before && this._built) return; this._built = false; if (this._hass) this._render(); };
    Shared.listeners.add(this._onShared);
  }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first && !Shared.data) Shared.get(hass).then(() => this._onShared?.());
    if (!this._built) this._render(); else this._update(); this._popup?.update(hass);
  }
  get hass() { return this._hass; }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }

  _areaName() { const a = this._hass?.areas?.[this._cfg.area]; return a?.name || titleCase(this._cfg.area); }
  _icon() {
    if (this._cfg.room_icon) return this._cfg.room_icon;
    const a = this._hass?.areas?.[this._cfg.area]; if (a?.icon) return a.icon;
    const key = (this._cfg.area + ' ' + (a?.name || '')).toLowerCase();
    return (ICON_GUESS.find(([re]) => re.test(key)) || [, 'mdi:lightbulb-group'])[1];
  }
  _picture() {
    let k = this._cfg.picture;
    if (k === 'auto') { const key = (this._cfg.area + ' ' + this._areaName()).toLowerCase(); k = (PIC_GUESS.find(([re]) => re.test(key)) || [, 'living_room'])[1]; }
    let svg = PICTURES[k] || '';
    if (svg && this._cfg.picture_caption != null) svg = svg.replace(/(<text[^>]*>)[^<]*(<\/text>)/, `$1${esc(this._cfg.picture_caption)}$2`);
    return svg;
  }

  _render() {
    const c = this._cfg, R = this.shadowRoot;
    if (!c.area) { R.innerHTML = `<ha-card style="padding:16px">Pick a room in the card editor.</ha-card>`; return; }
    const pick = (map, key, dflt) => map[key] ?? map[dflt];
    const padPx = pick({ compact: 12, standard: 18, roomy: 24 }, c.card_spacing, 'standard');
    const radius = pick({ square: '8px', rounded: '22px', extra_round: '32px' }, c.corners, 'rounded');
    const title = pick({ small: '17px', medium: '21px', large: '24px', extra_large: '28px' }, c.title_size, 'medium');
    const btnPx = pick({ small: 56, medium: 68, large: 80, extra_large: 96 }, c.button_size, 'large');
    const bRad = pick({ square: '6px', rounded: '14px', extra_round: '50%' }, c.button_shape, 'rounded');
    const bText = pick({ small: '12px', medium: '14px', large: '17px' }, c.button_text_size, 'medium');
    const tint = pick({ very_soft: [.28, .30], soft: [.44, .46], medium: [.60, .62], bold: [.80, .82] }, c.button_tint, 'soft');
    const glow = pick({ subtle: [.13, .06, .2], normal: [.25, .12, .34], strong: [.42, .24, .5] }, c.on_glow, 'normal');
    const font = pick({ classic: 'Arial,Helvetica,sans-serif', theme: 'var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,sans-serif))', rounded: "ui-rounded,'SF Pro Rounded','Nunito','Varela Round',system-ui,sans-serif" }, c.font, 'classic');
    const slider = pick({ thin: [44, 6, 22], standard: [56, 12, 32], thick: [64, 20, 40] }, c.slider_size, 'standard');
    const bubbleH = pick({ thin: 46, standard: 58, thick: 72 }, c.slider_size, 'standard');
    const chip = pick({ small: '32px', medium: '40px', large: '48px' }, c.chip_size, 'medium');
    const artH = pick({ small: '84px', medium: '112px', large: '150px' }, c.picture_size, 'medium');
    const onC = okRgb(c.on_color) ? c.on_color : DEFAULTS.on_color, offC = okRgb(c.off_color) ? c.off_color : DEFAULTS.off_color;
    const lift = (col, n) => col.map(v => Math.min(255, v + n));
    const btnLook = (col, a) => ({
      tinted: [rgba(col, a), `1px solid ${rgba(lift(col, 60), .7)}`, '#f7f9fc'],
      solid: [rgba(col, 1), `1px solid ${rgba(lift(col, 40), .9)}`, '#ffffff'],
      outline: ['transparent', `2px solid ${rgba(lift(col, 70), .95)}`, rgba(lift(col, 90), 1)],
      glass: ['rgba(255,255,255,.08)', '1px solid rgba(255,255,255,.2)', rgba(lift(col, 90), 1)],
    }[c.button_style] || null);
    const onLook = btnLook(onC, tint[0]) || btnLook(onC, tint[0]), offLook = btnLook(offC, tint[1]);
    const offBg = { theme: 'var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))))', darker: 'rgba(14,16,21,.50)', lighter: 'rgba(120,128,142,.30)', custom: okRgb(c.off_custom_color) ? rgba(c.off_custom_color, .55) : 'var(--secondary-background-color)' }[c.off_background] || 'var(--secondary-background-color)';
    const vars = [`--osl-pad:${padPx}px`, `--osl-radius:${radius}`, `--osl-title:${title}`, `--osl-btn:${btnPx}px`, `--osl-btn-radius:${bRad}`, `--osl-btn-text:${bText}`, `--osl-font:${font}`,
      `--osl-on-bg:${onLook[0]}`, `--osl-on-border:${onLook[1]}`, `--osl-on-fg:${onLook[2]}`,
      `--osl-off-btn-bg:${offLook[0]}`, `--osl-off-border:${offLook[1]}`, `--osl-off-fg:${offLook[2]}`,
      `--osl-glow-a:${glow[0]}`, `--osl-glow-b:${glow[1]}`, `--osl-glow-border:${glow[2]}`, `--osl-off-bg:${offBg}`,
      `--sl-h:${slider[0]}px`, `--sl-bh:${bubbleH}px`, `--sl-br:${c.corners === 'square' ? '8px' : c.corners === 'extra_round' ? '999px' : '18px'}`, `--sl-t:${slider[1]}px`, `--sl-th:${slider[2]}px`,
      `--sl-c:${c.slider_colour === 'custom' && okRgb(c.slider_custom_color) ? rgba(c.slider_custom_color, 1) : c.slider_colour === 'white' ? '#f2f5f9' : 'rgba(var(--osl-rgb),.95)'}`,
      `--chip:${chip}`, `--chip-r:${c.chip_shape === 'rounded' ? '30%' : '50%'}`, `--osl-art-h:${artH}`];
    if (okRgb(c.title_color) && !same(c.title_color, DEFAULTS.title_color)) vars.push(`--osl-title-color:${rgba(c.title_color, 1)}`);
    if (okRgb(c.hover_color) && !same(c.hover_color, DEFAULTS.hover_color)) vars.push(`--osl-hover:${rgba(c.hover_color, .8)}`);
    if (c.icon_color === 'custom' && okRgb(c.icon_custom_color)) vars.push(`--osl-icon-color:${rgba(c.icon_custom_color, 1)}`, `--osl-icon-bg:${rgba(c.icon_custom_color, .12)}`);
    else if (c.icon_color === 'white') vars.push('--osl-icon-color:#f7f9fc', '--osl-icon-bg:rgba(255,255,255,.08)');
    if (!c.icon_background) vars.push('--osl-icon-bg:transparent');
    // chips: white buttons, colour buttons, colour wheel
    const whites = c.show_presets ? [c.preset_1, c.preset_2, c.preset_3, c.preset_4].map(k => String(k)).filter(k => k && k !== 'none') : [];
    const colours = c.show_presets ? [c.colour_1, c.colour_2, c.colour_3].slice(0, Math.max(0, Math.min(3, +c.colour_count || 0))).filter(okRgb) : [];
    const chipCount = whites.length + colours.length + (c.show_wheel ? 1 : 0);
    vars.push(`--osl-chips:${Math.max(1, chipCount)}`);
    // where the On/Off buttons go: beside the title, or underneath when the card is narrow
    const iconW = c.show_icon ? 44 + 12 : 0;
    const needed = iconW + 150 + 12 + btnPx * 2 + 8;   // container width is measured inside the padding
    const belowCss = c.button_position === 'auto' ? `@container osl (max-width:${needed}px){.wrap{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"i n" "p p" "art art" "m m"}.wrap.noicon{grid-template-columns:minmax(0,1fr);grid-template-areas:"n" "p" "art" "m"}.wrap .pbtn{flex:1 1 0;height:min(var(--osl-btn,80px),76px)}}` : '';
    const content = c.button_content || 'icon_words';
    const btnInner = (icon, text) => `${content !== 'words' ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : ''}${content !== 'icon' ? `<span>${esc(text)}</span>` : ''}`;
    const btnCls = content === 'icon' ? 'icononly' : content === 'words' ? 'wordsonly' : '';
    let pic = '';
    if (c.show_picture) pic = c.picture === 'custom' ? (c.picture_url ? `<img src="${esc(c.picture_url)}" alt="">` : '') : this._picture();
    const wrapCls = ['wrap', c.show_icon ? '' : 'noicon', c.button_position === 'below' ? 'below' : ''].join(' ');
    R.innerHTML = `<style>${CARD_CSS}${belowCss}</style>
<ha-card class="${c.animations ? 'anim' : ''}" style="${vars.join(';')}" role="button" tabindex="0" aria-label="${esc(this._title())} lights">
 <div class="${wrapCls}">
  <div class="icon ${c.show_icon ? '' : 'hide'}"><ha-icon></ha-icon></div>
  <div class="head"><div class="name"></div><div class="status ${c.show_status ? '' : 'hide'}"></div></div>
  <div class="power ${c.show_buttons ? '' : 'hide'}">
   <button class="pbtn on ${btnCls}" data-act="on" aria-label="Turn ${esc(this._title())} lights on">${btnInner(c.on_icon, c.on_text)}</button>
   <button class="pbtn off ${btnCls}" data-act="off" aria-label="Turn ${esc(this._title())} lights off">${btnInner(c.off_icon, c.off_text)}</button>
  </div>
  <div class="art ${pic ? '' : 'hide'} ${c.picture_on_phones ? 'phones' : ''}">${pic}</div>
  <div class="master ${c.show_brightness || chipCount ? '' : 'hide'}">
   ${c.slider_style === 'classic' ? `<div class="dim ${c.show_brightness ? '' : 'hide'}"><div class="dimhead ${c.show_brightness_words ? '' : 'hide'}"><span>Brightness</span><output></output></div>
    <input type="range" min="0" max="100" step="1" aria-label="${esc(this._title())} brightness"></div>`
    : `<div class="dim bubble ${c.show_brightness ? '' : 'hide'} ${c.show_brightness_words ? '' : 'nowords'}"><div class="bfill"></div>
    <div class="blabel"><ha-icon icon="mdi:brightness-6"></ha-icon><span class="btext">Brightness</span><output class="bpct"></output></div>
    <input type="range" min="0" max="100" step="1" aria-label="${esc(this._title())} brightness"></div>`}
   ${whites.map(k => `<button class="chip preset" data-k="${esc(k)}" title="${esc((PRESETS[k] || ['White'])[0])} · ${esc(k)} K" aria-label="${esc((PRESETS[k] || ['White'])[0])} ${esc(k)} kelvin"><span style="background:${(PRESETS[k] || [, '#ffe4ce'])[1]}"></span></button>`).join('')}
   ${colours.map(col => `<button class="chip fav" data-rgb="${col.join(',')}" title="Colour" aria-label="Set colour"><span style="background:${rgba(col, 1)}"></span></button>`).join('')}
   <button class="chip wheel ${c.show_wheel ? '' : 'hide'}" title="More colours" aria-label="More colours"><span></span></button>
   <div class="msg" aria-live="polite"></div>
  </div>
 </div>
</ha-card>`;
    this._el = { card: R.querySelector('ha-card'), icon: R.querySelector('.icon ha-icon'), name: R.querySelector('.name'), status: R.querySelector('.status'), range: R.querySelector('input[type=range]'), out: R.querySelector('output'), dim: R.querySelector('.dim'), msg: R.querySelector('.msg'), on: R.querySelector('[data-act=on]'), off: R.querySelector('[data-act=off]') };
    this._wire();
    this._built = true;
    this._update();
  }
  _title() { return this._cfg.name || this._areaName(); }

  _wire() {
    const { card, range, on, off } = this._el;
    const stop = e => e.stopPropagation();
    for (const el of this.shadowRoot.querySelectorAll('.power, .master')) { el.addEventListener('click', stop); el.addEventListener('pointerdown', stop); }
    on.addEventListener('click', () => this._power(true));
    off.addEventListener('click', () => this._power(false));
    this.shadowRoot.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => this._applyColour({ color_temp_kelvin: +b.dataset.k })));
    this.shadowRoot.querySelectorAll('.fav').forEach(b => b.addEventListener('click', () => this._applyColour({ rgb_color: b.dataset.rgb.split(',').map(Number) })));
    if (this._cfg.haptics) this.shadowRoot.querySelectorAll('button').forEach(b => b.addEventListener('click', () => this._haptic()));
    this.shadowRoot.querySelector('.wheel').addEventListener('click', () => this._openColour());
    // live brightness while dragging (throttled), final value on release
    let last = 0, timer = null, sent = null;
    const send = () => { if (+range.value === sent) return; sent = +range.value; this._sendBrightness(sent); last = Date.now(); };
    range.addEventListener('pointerdown', () => { this._dragging = true; sent = null; });
    range.addEventListener('input', () => {
      this._dragging = true; this._paintRange(+range.value);
      clearTimeout(timer); const wait = 160 - (Date.now() - last);
      if (wait <= 0) send(); else timer = setTimeout(send, wait);
    });
    range.addEventListener('change', () => { clearTimeout(timer); send(); setTimeout(() => { this._dragging = false; }, 1200); });
    // tap / hold on the card body
    let holdTimer = null, held = false;
    card.addEventListener('pointerdown', e => { held = false; holdTimer = setTimeout(() => { held = true; this._action(this._cfg.hold, this._cfg.hold_page); }, 550); });
    const cancel = () => clearTimeout(holdTimer);
    card.addEventListener('pointerup', cancel); card.addEventListener('pointerleave', cancel); card.addEventListener('pointercancel', cancel);
    card.addEventListener('click', () => { if (held) { held = false; return; } this._action(this._cfg.tap, this._cfg.tap_page); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._action(this._cfg.tap, this._cfg.tap_page); } });
  }
  _haptic() { window.dispatchEvent(new CustomEvent('haptic', { detail: 'light' })); }
  _action(kind, page) {
    if (kind === 'popup') return this._openPopup();
    if (kind === 'page' && page) { history.pushState(null, '', page); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } })); }
  }

  _update() {
    const h = this._hass, c = this._cfg; if (!h || !this._el) return;
    const members = roomLights(h, c);
    this._members = members;
    const states = members.map(id => h.states[id]).filter(Boolean);
    const onStates = states.filter(isOn);
    const master = masterLights(h, c, members);
    const active = c.rule_active === 'master' ? master.some(id => isOn(h.states[id])) : onStates.length > 0;
    // live room colour (brightness-weighted)
    let rgb = NEUTRAL, groups = [];
    if (active && c.follow_light_colour !== false) {
      let w = 0, acc = [0, 0, 0];
      for (const st of onStates) {
        const b = (st.attributes.brightness ?? 255) / 255 + .05, col = lightRgb(st);
        acc = acc.map((v, i) => v + col[i] * b); w += b;
        // group lights with nearly the same colour so each different colour shows on its own
        const g = groups.find(x => Math.hypot(x.rgb[0] - col[0], x.rgb[1] - col[1], x.rgb[2] - col[2]) < 70);
        if (g) { g.rgb = g.rgb.map((v, i) => (v * g.w + col[i] * b) / (g.w + b)); g.w += b; } else groups.push({ rgb: col.slice(), w: b });
      }
      rgb = acc.map(v => Math.round(v / w));
      groups.sort((a, b) => b.w - a.w);
      if (groups.length) rgb = groups[0].rgb.map(Math.round);
    } else if (active) rgb = [255, 196, 120];
    const multi = c.glow_mode !== 'blend' && groups.length > 1;
    if (c.glow_mode === 'blend' && active && c.follow_light_colour !== false) {
      let w = 0, acc = [0, 0, 0]; for (const g of groups) { acc = acc.map((v, i) => v + g.rgb[i] * g.w); w += g.w; } rgb = acc.map(v => Math.round(v / w));
    }
    this._el.card.style.setProperty('--osl-rgb', rgb.join(','));
    this._el.card.classList.toggle('multi', multi);
    if (multi) {
      const cols = groups.slice(0, 5).map(g => g.rgb.map(Math.round).join(',')).sort((a, b) => hueOf(a) - hueOf(b));
      const stops = cols.map((col, i) => `rgba(${col},calc(var(--osl-glow-a,.25) + .12)) ${Math.round(i * 100 / (cols.length - 1))}%`).join(',');
      this._el.card.style.setProperty('--osl-multi', `linear-gradient(115deg,${stops})`);
      if (c.slider_colour === 'lights' || !c.slider_colour) this._el.card.style.setProperty('--osl-fill', `linear-gradient(90deg,${cols.map(col => `rgb(${col})`).join(',')})`);
      else this._el.card.style.removeProperty('--osl-fill');
    } else { this._el.card.style.removeProperty('--osl-multi'); this._el.card.style.removeProperty('--osl-fill'); }
    this._el.card.classList.toggle('on', active);
    this._el.icon.setAttribute('icon', this._icon());
    this._el.name.textContent = this._title();
    if (c.show_status) {
      const n = onStates.length, total = states.length;
      this._el.status.textContent = !total ? 'No lights found' : n === 0 ? 'All off' : n === total ? (total === 1 ? 'On' : `All ${total} on`) : `${n} of ${total} on`;
    }
    const targets = c.rule_on === 'all' ? members.filter(id => live(h.states[id])) : onTargets(h, c, members);
    this._el.on.disabled = !targets.length;
    this._el.on.classList.toggle('hide', !master.length && c.no_master === 'hide' && c.rule_on !== 'all');
    this._el.off.disabled = !ruleSet(h, c, members, c.rule_off).length;
    // brightness
    const sliderIds = c.rule_slider === 'on' ? members : ruleSet(h, c, members, c.rule_slider);
    const dimOn = sliderIds.map(id => h.states[id]).filter(st => isOn(st) && dimmable(st));
    const pct = dimOn.length ? Math.round(dimOn.reduce((s, st) => s + (st.attributes.brightness || 0), 0) / dimOn.length / 2.55) : 0;
    if (!this._dragging) { this._el.range.value = pct; this._paintRange(pct); }
    this._el.range.disabled = !states.some(st => live(st) && dimmable(st));
    const tempOk = states.some(st => live(st) && supportsTemp(st)), colOk = states.some(st => live(st) && supportsColour(st));
    this.shadowRoot.querySelectorAll('.preset').forEach(b => { b.disabled = !tempOk; });
    this.shadowRoot.querySelectorAll('.fav').forEach(b => { b.disabled = !colOk; });
    this.shadowRoot.querySelector('.wheel').disabled = !(colOk || tempOk);
  }
  _paintRange(v) { this._el.range.style.setProperty('--pct', v + '%'); this._el.dim.style.setProperty('--pct', v + '%'); this._el.out.textContent = v + '%'; }
  _say(text) { this._el.msg.textContent = text || ''; if (text) setTimeout(() => { if (this._el.msg.textContent === text) this._el.msg.textContent = ''; }, 5000); }
  async _call(domain, service, data) {
    try { await this._hass.callService(domain, service, data); }
    catch (e) { this._say(e?.message || 'Couldn’t reach the lights'); }
  }

  _power(turnOn) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    if (!turnOn) { const t = ruleSet(h, c, members, c.rule_off); if (t.length) this._call('homeassistant', 'turn_off', { entity_id: t }); return; }
    const anyOn = members.some(id => isOn(h.states[id]));
    const useAll = c.rule_on === 'all' || (c.rule_on === 'master_if_off' && anyOn);
    const t = useAll ? members.filter(id => live(h.states[id])) : onTargets(h, c, members);
    if (!t.length) return;
    const extra = c.on_brightness === 'fixed' ? { brightness_pct: +c.on_brightness_pct || 100 } : {};
    if (c.on_white && c.on_white !== 'keep') {
      const k = +c.on_white, warm = t.filter(id => supportsTemp(h.states[id])), rest = t.filter(id => !supportsTemp(h.states[id]));
      if (warm.length) this._call('light', 'turn_on', { entity_id: warm, color_temp_kelvin: k, ...extra });
      const rl = rest.filter(id => id.startsWith('light.')), ro = rest.filter(id => !id.startsWith('light.'));
      if (rl.length) this._call('light', 'turn_on', { entity_id: rl, ...(dimmableAll(h, rl) ? extra : {}) });
      if (ro.length) this._call('homeassistant', 'turn_on', { entity_id: ro });
    } else {
      const lights = t.filter(id => id.startsWith('light.')), other = t.filter(id => !id.startsWith('light.'));
      if (lights.length) this._call('light', 'turn_on', { entity_id: lights, ...(dimmableAll(h, lights) ? extra : {}) });
      if (other.length) this._call('homeassistant', 'turn_on', { entity_id: other });
    }
  }
  _sendBrightness(v) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    if (c.rule_slider === 'master' || c.rule_slider === 'all') {
      const t = ruleSet(h, c, members, c.rule_slider).filter(id => dimmable(h.states[id]) || isGroup(h.states[id]));
      if (!t.length) return;
      if (v <= 0) this._call('light', 'turn_off', { entity_id: t }); else this._call('light', 'turn_on', { entity_id: t, brightness_pct: v });
      return;
    }
    const onNow = members.filter(id => isOn(h.states[id]) && dimmable(h.states[id]));
    if (v <= 0) { if (onNow.length) this._call('light', 'turn_off', { entity_id: onNow }); return; }
    const t = onNow.length ? onNow : onTargets(h, c, members).filter(id => dimmable(h.states[id]) || isGroup(h.states[id]));
    if (t.length) this._call('light', 'turn_on', { entity_id: t, brightness_pct: v });
  }
  /* Colour rule: if any room light is on, change only the lights that are on (keep their brightness).
     If everything is off, turn on the "On button" lights at the wake-up brightness. */
  _applyColour(data) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    const anyOn = members.some(id => isOn(h.states[id]));
    let targets;
    if (c.rule_colour === 'master') targets = onTargets(h, c, members);
    else if (c.rule_colour === 'all') targets = members.filter(id => live(h.states[id]));
    else targets = anyOn ? members.filter(id => isOn(h.states[id])) : onTargets(h, c, members);
    const wantsTemp = 'color_temp_kelvin' in data;
    targets = targets.filter(id => { const st = h.states[id]; return live(st) && (isGroup(st) || (wantsTemp ? supportsTemp(st) : supportsColour(st))); });
    if (!targets.length) { this._say(anyOn ? 'None of the lights that are on can do that colour.' : 'No lights here can do that colour.'); return; }
    for (const id of targets) {
      const st = h.states[id], d = { entity_id: id, ...data };
      if (wantsTemp && !isGroup(st)) { const lo = st.attributes.min_color_temp_kelvin || 2000, hi = st.attributes.max_color_temp_kelvin || 6500; d.color_temp_kelvin = Math.max(lo, Math.min(hi, data.color_temp_kelvin)); }
      if (!isOn(st)) d.brightness_pct = +c.wake_brightness || 50;
      this._call('light', 'turn_on', d);
    }
  }
  _openColour() { this._ensurePopup().open('colour'); }
  _openPopup() { this._ensurePopup().open('lights'); }
  _ensurePopup() {
    if (!this._popup) { this._popup = document.createElement(POPUP_TAG); this._popup.card = this; }
    if (!this._popup.isConnected) document.body.appendChild(this._popup);
    this._popup.update(this._hass);
    return this._popup;
  }
  disconnectedCallback() { this._popup?.close(); Shared.listeners.delete(this._onShared); }
}

/* ---------------- pop-up: individual lights + colour picker ---------------- */
const POP_CSS = `
:host{position:fixed;inset:0;z-index:9999;display:none;font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif)}
:host([open]){display:block}
.back{position:absolute;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(2px)}
.sheet{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(620px,100%);max-height:88vh;overflow:auto;overscroll-behavior:contain;box-sizing:border-box;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:28px 28px 0 0;background:linear-gradient(rgba(var(--osl-rgb),.18),rgba(var(--osl-rgb),.08)),var(--card-background-color,#1c1c1c);color:var(--primary-text-color,#f7f9fc);box-shadow:0 -10px 40px rgba(0,0,0,.4);animation:up .22s ease-out}
@media(min-width:768px){.sheet{bottom:auto;top:6vh;border-radius:28px}}
@keyframes up{from{transform:translate(-50%,24px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
header h2{flex:1;margin:0;font:650 21px/25px Arial,sans-serif;letter-spacing:-.4px}
.x{all:unset;cursor:pointer;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08)}
.row{margin-bottom:10px;padding:12px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.row.on{background:linear-gradient(rgba(var(--c),.16),rgba(var(--c),.08));border-color:rgba(var(--c),.35)}
.top{display:flex;align-items:center;gap:12px}
.ic,.cbtn,.more{all:unset;box-sizing:border-box;flex:none;cursor:pointer;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1)}
.row.on .ic{background:rgb(var(--c));color:#111}
.ic ha-icon{--mdc-icon-size:28px}
.tx{flex:1;min-width:0;cursor:pointer;padding:4px 0}
.nm{font:600 18px/22px Arial,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.stt{font:15px/20px Arial,sans-serif;opacity:.78}
.cbtn span{width:30px;height:30px;border-radius:50%;background:conic-gradient(red,#ff0,lime,cyan,blue,#f0f,red);box-shadow:0 0 0 2px rgba(255,255,255,.7)}
.cbtn.open span{box-shadow:0 0 0 3px #fff}
.more{width:40px;height:40px;background:transparent;opacity:.7}
.bar{position:relative;margin-top:10px;height:52px;border-radius:16px;overflow:hidden;background:rgba(255,255,255,.08);cursor:ew-resize;touch-action:none}
.bar .bf{position:absolute;inset:0 auto 0 0;width:0;background:rgba(var(--c),.75)}
.bar .bl{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 16px;pointer-events:none;font:600 15px/1 Arial,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.bar.dis{opacity:.4;cursor:default}
.pal{display:none;margin-top:12px;gap:10px;flex-direction:column}
.pal.open{display:flex}
.pal .lbl{font:600 13px/1 Arial,sans-serif;opacity:.7;letter-spacing:.3px;text-transform:uppercase}
.sw{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.sw button{all:unset;cursor:pointer;aspect-ratio:1;border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.25),0 2px 6px rgba(0,0,0,.3)}
.sw button:active{transform:scale(.92)}
.hue{position:relative;height:44px;border-radius:14px;cursor:ew-resize;touch-action:none;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}
.hue i{position:absolute;top:-3px;bottom:-3px;width:10px;margin-left:-5px;border-radius:6px;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.35);pointer-events:none}
.empty{opacity:.7;padding:20px 4px}
.wheelbox{display:flex;flex-direction:column;align-items:center;gap:16px;padding:6px 0 10px}
.wheel{width:260px;height:260px;border-radius:50%;cursor:crosshair;touch-action:none;position:relative;background:radial-gradient(circle,#fff 0,rgba(255,255,255,0) 70%),conic-gradient(from 90deg,red,#ff0,lime,cyan,blue,#f0f,red)}
.temps{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;width:100%}
.temps button{all:unset;cursor:pointer;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.14)}
.note{font:13px/17px Arial,sans-serif;opacity:.75;text-align:center}
.hide{display:none!important}
`;

class OneStopRoomLightsPopup extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._onKey = e => { if (e.key === 'Escape') this.close(); }; }
  open(mode) { this._mode = mode; this.setAttribute('open', ''); this._build(); document.addEventListener('keydown', this._onKey); }
  close() { this.removeAttribute('open'); document.removeEventListener('keydown', this._onKey); }
  update(hass) { this._hass = hass; if (this.hasAttribute('open') && this._mode === 'lights') this._refresh(); }
  _build() {
    const card = this.card, title = card._title();
    this.style.setProperty('--osl-rgb', card._el.card.style.getPropertyValue('--osl-rgb') || '184,184,184');
    this.shadowRoot.innerHTML = `<style>${POP_CSS}</style><div class="back"></div><div class="sheet" role="dialog" aria-label="${esc(title)}">
      <header><h2>${esc(this._mode === 'colour' ? title + ' colour' : title)}</h2><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></header><div class="body"></div></div>`;
    this.shadowRoot.querySelector('.back').onclick = () => this.close();
    this.shadowRoot.querySelector('.x').onclick = () => this.close();
    this._body = this.shadowRoot.querySelector('.body');
    this._rows = {};
    if (this._mode === 'colour') this._buildColour(); else this._refresh();
  }
  _refresh() {
    const h = this._hass, card = this.card; if (!h || !this._body) return;
    const ids = roomLights(h, card._cfg);
    if (!ids.length) { this._body.innerHTML = `<div class="empty">No lights are assigned to this room yet. Assign lights to the room in Home Assistant, or add them under “Other lights” in the card editor.</div>`; this._rows = {}; return; }
    if (Object.keys(this._rows).join() !== ids.join()) {
      this._body.innerHTML = ''; this._rows = {};
      for (const id of ids) { const row = this._makeRow(id); this._body.appendChild(row); this._rows[id] = row; }
    }
    for (const id of ids) this._paintRow(id);
  }
  _makeRow(id) {
    const card = this.card;
    const row = document.createElement('div'); row.className = 'row';
    const whites = [2000, 2700, 3000, 3500, 4000, 5000, 6500];
    const colours = [[255, 0, 0], [255, 120, 0], [255, 210, 0], [0, 200, 60], [0, 200, 255], [40, 80, 255], [170, 60, 255], [255, 60, 170]];
    row.innerHTML = `<div class="top">
        <button class="ic" aria-label="Turn on or off"><ha-icon></ha-icon></button>
        <div class="tx"><div class="nm"></div><div class="stt"></div></div>
        <button class="cbtn" aria-label="Colour"><span></span></button>
        <button class="more" aria-label="All settings"><ha-icon icon="mdi:dots-vertical"></ha-icon></button>
      </div>
      <div class="bar" role="slider" aria-label="Brightness" aria-valuemin="1" aria-valuemax="100"><div class="bf"></div><div class="bl"><span>Brightness</span><span class="bp"></span></div></div>
      <div class="pal">
        <div class="lbl">White</div><div class="sw wh">${whites.map(k => `<button data-k="${k}" title="${k} K" style="background:rgb(${kelvinToRgb(k).join(',')})"></button>`).join('')}</div>
        <div class="lbl cl">Colour</div><div class="sw co" style="grid-template-columns:repeat(8,1fr)">${colours.map(c => `<button data-rgb="${c.join(',')}" style="background:rgb(${c.join(',')})"></button>`).join('')}</div>
        <div class="hue" role="slider" aria-label="Pick any colour"><i></i></div>
      </div>`;
    const q = s => row.querySelector(s);
    const toggle = () => card._call('homeassistant', 'toggle', { entity_id: id });
    q('.ic').addEventListener('click', toggle);
    q('.tx').addEventListener('click', toggle);
    q('.more').addEventListener('click', () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })));
    q('.cbtn').addEventListener('click', () => { const p = q('.pal'); p.classList.toggle('open'); q('.cbtn').classList.toggle('open', p.classList.contains('open')); });
    const set = data => { const st = this._hass.states[id]; const d = { entity_id: id, ...data }; if (!isOn(st)) d.brightness_pct = +card._cfg.wake_brightness || 50; card._call('light', 'turn_on', d); };
    row.querySelectorAll('.wh button').forEach(b => b.addEventListener('click', () => { const st = this._hass.states[id]; const lo = st.attributes.min_color_temp_kelvin || 2000, hi = st.attributes.max_color_temp_kelvin || 6500; set({ color_temp_kelvin: Math.max(lo, Math.min(hi, +b.dataset.k)) }); }));
    row.querySelectorAll('.co button').forEach(b => b.addEventListener('click', () => set({ rgb_color: b.dataset.rgb.split(',').map(Number) })));
    // drag helpers that work with fingers and mice
    const drag = (el, onMove, onEnd) => {
      let active = false;
      const pos = e => { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
      el.addEventListener('pointerdown', e => { if (el.classList.contains('dis')) return; active = true; el.setPointerCapture(e.pointerId); onMove(pos(e), true); e.preventDefault(); });
      el.addEventListener('pointermove', e => { if (active) onMove(pos(e), false); });
      const end = e => { if (!active) return; active = false; onEnd(pos(e)); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', e => { active = false; row._drag = false; });
    };
    let last = 0, timer = null;
    const sendB = v => { last = Date.now(); card._call('light', 'turn_on', { entity_id: id, brightness_pct: v }); };
    drag(q('.bar'), (f, first) => {
      row._drag = true; const v = Math.max(1, Math.round(f * 100));
      q('.bf').style.width = v + '%'; q('.bp').textContent = v + '%'; row._want = v;
      clearTimeout(timer); const wait = 200 - (Date.now() - last); if (wait <= 0) sendB(v); else timer = setTimeout(() => sendB(row._want), wait);
    }, f => { clearTimeout(timer); sendB(Math.max(1, Math.round(f * 100))); setTimeout(() => { row._drag = false; }, 1500); });
    let hLast = 0, hTimer = null;
    const sendH = hue => { hLast = Date.now(); set({ hs_color: [hue, 100] }); };
    drag(q('.hue'), f => {
      const hue = Math.round(f * 360) % 360; q('.hue i').style.left = (f * 100) + '%';
      clearTimeout(hTimer); const wait = 250 - (Date.now() - hLast); if (wait <= 0) sendH(hue); else hTimer = setTimeout(() => sendH(hue), wait);
    }, f => { clearTimeout(hTimer); sendH(Math.round(f * 360) % 360); });
    return row;
  }
  _paintRow(id) {
    const h = this._hass, st = h.states[id], row = this._rows[id]; if (!st || !row) return;
    const q = s => row.querySelector(s);
    const on = isOn(st), isLight = id.startsWith('light.'), dim = isLight && dimmable(st);
    const pct = on ? Math.max(1, Math.round((st.attributes.brightness ?? 255) / 2.55)) : 0;
    const col = on ? lightRgb(st) : [150, 150, 150];
    row.classList.toggle('on', on); row.style.setProperty('--c', col.join(','));
    q('.ic ha-icon').setAttribute('icon', st.attributes.icon || (isLight ? (on ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline') : (on ? 'mdi:power-plug' : 'mdi:power-plug-off')));
    q('.nm').textContent = st.attributes.friendly_name || id;
    q('.stt').textContent = !live(st) ? 'Not responding' : on ? (dim ? pct + '%' : 'On') : 'Off';
    q('.bar').classList.toggle('hide', !dim); q('.bar').classList.toggle('dis', !live(st));
    if (!row._drag) { q('.bf').style.width = pct + '%'; q('.bp').textContent = on ? pct + '%' : 'Off'; }
    const temp = isLight && supportsTemp(st), colour = isLight && supportsColour(st);
    q('.cbtn').classList.toggle('hide', !(temp || colour));
    q('.wh').classList.toggle('hide', !temp); q('.pal .lbl').classList.toggle('hide', !temp);
    q('.co').classList.toggle('hide', !colour); q('.cl').classList.toggle('hide', !colour); q('.hue').classList.toggle('hide', !colour);
    if (on && Array.isArray(st.attributes.hs_color) && !row._hueDrag) q('.hue i').style.left = (st.attributes.hs_color[0] / 360 * 100) + '%';
  }
  _buildColour() {
    const card = this.card;
    const temps = [2000, 2700, 3000, 3500, 4000, 5000, 6500];
    this._body.innerHTML = `<div class="wheelbox"><div class="wheel" role="slider" aria-label="Colour wheel"></div>
      <div class="temps">${temps.map(k => `<button data-k="${k}" title="${k} K" style="background:${rgba(kelvinToRgb(k), 1)}"></button>`).join('')}</div>
      <div class="note">If any lights are on, only those change. If they’re all off, the room turns on at ${+card._cfg.wake_brightness || 50}%.</div></div>`;
    const wheel = this._body.querySelector('.wheel');
    const pick = e => { const r = wheel.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const d = Math.min(1, Math.hypot(x, y) / (r.width / 2)); let hue = Math.atan2(y, x) * 180 / Math.PI; hue = (hue + 360) % 360;
      return [Math.round(hue), Math.round(d * 100)]; };
    let down = false, last = 0;
    wheel.addEventListener('pointerdown', e => { down = true; wheel.setPointerCapture(e.pointerId); });
    wheel.addEventListener('pointermove', e => { if (!down || Date.now() - last < 200) return; last = Date.now(); card._applyColour({ hs_color: pick(e) }); });
    wheel.addEventListener('pointerup', e => { down = false; card._applyColour({ hs_color: pick(e) }); });
    this._body.querySelectorAll('.temps button').forEach(b => b.addEventListener('click', () => card._applyColour({ color_temp_kelvin: +b.dataset.k })));
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const presetChoices = sel([...Object.entries(PRESETS).map(([k, [n]]) => [k, `${n} (${k} K)`]), ['none', 'No button']]);
const schema = d => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  const size4 = sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]);
  return [
  { name: 'area', required: true, selector: { area: {} } },
  grid([{ name: 'name', selector: { text: {} } }, { name: 'room_icon', selector: { icon: {} } }]),
  section('g_master', 'Master lights', 'mdi:lightbulb-on-outline', [
    { name: 'master_lights', selector: { entity: { multiple: true, filter: [{ domain: 'light' }, { domain: 'switch' }] } } },
    { name: 'no_master', selector: sel([['all', 'Use every light in the room'], ['hide', 'Hide the On button']]) },
  ]),
  section('g_rules', 'Master rules', 'mdi:script-text-outline', [
    { name: 'rule_on', selector: sel([['master', 'Turn on the master lights'], ['master_if_off', 'Master lights if the room is off, every light if some are already on'], ['all', 'Turn on every light in the room']]) },
    grid([
      { name: 'on_brightness', selector: sel([['keep', 'Their last brightness'], ['fixed', 'A set brightness']]) },
      ...(d.on_brightness === 'fixed' ? [{ name: 'on_brightness_pct', selector: { number: { min: 5, max: 100, step: 5, mode: 'slider', unit_of_measurement: '%' } } }] : []),
      { name: 'on_white', selector: sel([['keep', 'Their last colour'], ...Object.entries(PRESETS).map(([k, [n]]) => [k, `${n} (${k} K)`])]) },
    ]),
    { name: 'rule_off', selector: sel([['all', 'Every light in the room'], ['master', 'Only the master lights']]) },
    { name: 'rule_slider', selector: sel([['on', 'Lights that are on (if all are off, the master lights)'], ['master', 'Always the master lights'], ['all', 'Every light in the room']]) },
    { name: 'rule_colour', selector: sel([['on', 'Lights that are on (if all are off, the master lights)'], ['master', 'Always the master lights'], ['all', 'Every light in the room']]) },
    { name: 'wake_brightness', selector: { number: { min: 5, max: 100, step: 5, mode: 'slider', unit_of_measurement: '%' } } },
    { name: 'rule_active', selector: sel([['any', 'Any light in the room is on'], ['master', 'A master light is on']]) },
  ]),
  section('g_lights', 'Other lights', 'mdi:lightbulb-group-outline', [
    { name: 'extra_lights', selector: { entity: { multiple: true, filter: [{ domain: 'light' }, { domain: 'switch' }] } } },
    { name: 'hide_lights', selector: { entity: { multiple: true, filter: { domain: 'light' } } } },
  ]),
  section('g_show', 'What to show', 'mdi:eye-outline', [grid([
    { name: 'show_icon', selector: toggle }, { name: 'show_status', selector: toggle },
    { name: 'show_buttons', selector: toggle }, { name: 'show_picture', selector: toggle },
    { name: 'show_brightness', selector: toggle }, { name: 'show_brightness_words', selector: toggle },
    { name: 'show_presets', selector: toggle }, { name: 'show_wheel', selector: toggle },
  ])]),
  section('g_layout', 'Layout and text', 'mdi:page-layout-header', [grid([
    { name: 'button_position', selector: sel([['auto', 'Beside the title (moves under on small screens)'], ['beside', 'Always beside the title'], ['below', 'Always under the title']]) },
    { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
    { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
    { name: 'font', selector: sel([['classic', 'Classic'], ['theme', 'Same as Home Assistant'], ['rounded', 'Rounded']]) },
    { name: 'title_size', selector: size4 },
    { name: 'title_color', selector: { color_rgb: {} } },
  ])]),
  section('g_colours', 'Colours and glow', 'mdi:palette-outline', [grid([
    { name: 'off_background', selector: sel([['theme', 'Clear frosted glass'], ['darker', 'Darker frosted glass'], ['lighter', 'Lighter frosted glass'], ['custom', 'Frosted glass in my own colour']]) },
    ...(d.off_background === 'custom' ? [{ name: 'off_custom_color', selector: { color_rgb: {} } }] : []),
    { name: 'on_glow', selector: sel([['subtle', 'Subtle'], ['normal', 'Normal'], ['strong', 'Strong']]) },
    { name: 'follow_light_colour', selector: toggle },
    { name: 'glow_mode', selector: sel([['each', 'Show each light colour'], ['blend', 'Blend into one colour']]) },
    { name: 'icon_color', selector: sel([['lights', 'Match the lights'], ['white', 'White'], ['custom', 'My own colour']]) },
    ...(d.icon_color === 'custom' ? [{ name: 'icon_custom_color', selector: { color_rgb: {} } }] : []),
    { name: 'icon_background', selector: toggle },
    { name: 'hover_color', selector: { color_rgb: {} } },
    { name: 'animations', selector: toggle },
  ])]),
  section('g_buttons', 'On and Off buttons', 'mdi:gesture-tap-button', [grid([
    { name: 'button_size', selector: size4 },
    { name: 'button_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Circle']]) },
    { name: 'button_style', selector: sel([['tinted', 'Soft colour'], ['solid', 'Solid colour'], ['outline', 'Outline'], ['glass', 'Clear glass']]) },
    ...(d.button_style === 'tinted' ? [{ name: 'button_tint', selector: sel([['very_soft', 'Very soft'], ['soft', 'Soft'], ['medium', 'Medium'], ['bold', 'Bold']]) }] : []),
    { name: 'button_content', selector: sel([['icon_words', 'Icon and words'], ['icon', 'Icon only'], ['words', 'Words only']]) },
    { name: 'button_text_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]) },
    { name: 'on_color', selector: { color_rgb: {} } }, { name: 'off_color', selector: { color_rgb: {} } },
    { name: 'on_text', selector: { text: {} } }, { name: 'off_text', selector: { text: {} } },
    { name: 'on_icon', selector: { icon: {} } }, { name: 'off_icon', selector: { icon: {} } },
  ])]),
  section('g_slider', 'Brightness slider', 'mdi:tune-variant', [grid([
    { name: 'slider_style', selector: sel([['bubble', 'Bubble (big rounded bar)'], ['classic', 'Classic (thin bar with a knob)']]) },
    { name: 'slider_size', selector: sel([['thin', 'Thin'], ['standard', 'Standard'], ['thick', 'Thick']]) },
    { name: 'slider_colour', selector: sel([['lights', 'Match the lights'], ['white', 'White'], ['custom', 'My own colour']]) },
    ...(d.slider_colour === 'custom' ? [{ name: 'slider_custom_color', selector: { color_rgb: {} } }] : []),
  ])]),
  section('g_presets', 'Light colour buttons', 'mdi:white-balance-sunny', [
    grid([
      { name: 'chip_shape', selector: sel([['circle', 'Circles'], ['rounded', 'Rounded squares']]) },
      { name: 'chip_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]) },
      { name: 'preset_1', selector: presetChoices }, { name: 'preset_2', selector: presetChoices },
      { name: 'preset_3', selector: presetChoices }, { name: 'preset_4', selector: presetChoices },
    ]),
    { name: 'colour_count', selector: sel([['0', 'None'], ['1', '1'], ['2', '2'], ['3', '3']]) },
    grid([
      ...(+d.colour_count >= 1 ? [{ name: 'colour_1', selector: { color_rgb: {} } }] : []),
      ...(+d.colour_count >= 2 ? [{ name: 'colour_2', selector: { color_rgb: {} } }] : []),
      ...(+d.colour_count >= 3 ? [{ name: 'colour_3', selector: { color_rgb: {} } }] : []),
    ]),
  ]),
  section('g_picture', 'Room picture', 'mdi:image-outline', [grid([
    { name: 'picture', selector: sel([...Object.entries(PICTURE_NAMES).filter(([k]) => k !== 'none'), ['custom', 'My own picture']]) },
    ...(d.picture === 'custom' ? [{ name: 'picture_url', selector: { text: {} } }] : [{ name: 'picture_caption', selector: { text: {} } }]),
    { name: 'picture_size', selector: sel([['small', 'Short'], ['medium', 'Standard'], ['large', 'Tall']]) },
    { name: 'picture_on_phones', selector: toggle },
  ])]),
  section('g_actions', 'Tap and hold', 'mdi:gesture-tap', [
    { name: 'tap', selector: sel([['popup', 'Show each light in a pop-up'], ['page', 'Go to a page'], ['none', 'Do nothing']]) },
    ...(d.tap === 'page' ? [{ name: 'tap_page', selector: { navigation: {} } }] : []),
    { name: 'hold', selector: sel([['popup', 'Show each light in a pop-up'], ['page', 'Go to a page'], ['none', 'Do nothing']]) },
    ...(d.hold === 'page' ? [{ name: 'hold_page', selector: { navigation: {} } }] : []),
    { name: 'haptics', selector: toggle },
  ]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Room Lights cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  area: 'Room', name: 'Card title', room_icon: 'Room icon',
  master_lights: 'Master lights (what turns on when the room is off)', no_master: 'If no master lights are picked',
  rule_on: 'When you press On', on_brightness: 'Turn on at', on_brightness_pct: 'Brightness', on_white: 'Light colour when turned on',
  rule_off: 'When you press Off, turn off', rule_slider: 'The brightness slider changes', rule_colour: 'The colour buttons change',
  rule_active: 'Show the room as on when', extra_lights: 'Add lights from other rooms', hide_lights: 'Leave these lights out',
  wake_brightness: 'Brightness when a colour turns a light on',
  show_icon: 'Room icon', show_status: 'How many lights are on', show_buttons: 'On / Off buttons', show_picture: 'Room picture',
  show_brightness: 'Brightness slider', show_brightness_words: 'Brightness word and %', show_presets: 'Light colour buttons', show_wheel: 'Colour wheel button',
  button_position: 'Where the On / Off buttons go', card_spacing: 'Spacing inside the card', corners: 'Card corners', font: 'Lettering style',
  title_size: 'Title size', title_color: 'Title colour',
  off_background: 'Background when the lights are off', off_custom_color: 'Your background colour', on_glow: 'Glow when the lights are on', follow_light_colour: 'Glow matches the light colour', glow_mode: 'When lights are different colours',
  icon_color: 'Room icon colour', icon_custom_color: 'Your icon colour', icon_background: 'Shaded box behind the icon',
  hover_color: 'Edge colour on mouse-over (grey = follow the lights)', animations: 'Gentle animations',
  button_size: 'Button size', button_shape: 'Button shape', button_style: 'Button style', button_tint: 'Colour strength',
  button_content: 'What the buttons show', button_text_size: 'Button word size',
  on_color: 'On button colour', off_color: 'Off button colour', on_text: 'On button words', off_text: 'Off button words', on_icon: 'On button icon', off_icon: 'Off button icon',
  slider_style: 'Slider style', slider_size: 'Slider thickness', slider_colour: 'Slider colour', slider_custom_color: 'Your slider colour',
  chip_shape: 'Button shape', chip_size: 'Button size',
  preset_1: 'White button 1', preset_2: 'White button 2', preset_3: 'White button 3', preset_4: 'White button 4',
  colour_count: 'Extra colour buttons', colour_1: 'Colour button 1', colour_2: 'Colour button 2', colour_3: 'Colour button 3',
  picture: 'Picture', picture_url: 'Picture web address (or /local/… file)', picture_caption: 'Words on the picture', picture_size: 'Picture height', picture_on_phones: 'Show on phones too',
  tap: 'When you tap the card', tap_page: 'Page to open on tap', hold: 'When you press and hold', hold_page: 'Page to open on hold', haptics: 'Vibrate on press (phones)',
};
const HELPERS = {
  name: 'Leave empty to use the room’s name.',
  master_lights: 'Tip: pick the room’s light group or its main lights. These are also used by the slider and colour buttons when the room is off.',
  rule_active: 'Controls the glow and the “on” look of the card.',
  hide_lights: 'Left-out lights stay out of the pop-up, the glow and the buttons.',
  picture_caption: 'Leave empty to keep the standard wording.',
  colour_count: 'Adds your own colour buttons next to the white ones.',
};

class OneStopRoomLightsCardEditor extends HTMLElement {
  setConfig(config) { const c = { ...config }; if (c.on_lights && !c.master_lights) { c.master_lights = c.on_lights; } delete c.on_lights; this._config = c; this._render(); }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first) Shared.get(hass).then(() => this._render());
    this._render();
  }
  _inherited() { return { ...DEFAULTS, ...((Shared.data || {}).room_lights || {}) }; }
  _ownStyleKeys() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _clean(v) {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null) continue;
      if (Array.isArray(val) && !val.length && !okRgb(val)) continue;
      if (k === 'off_custom_color' && v.off_background !== 'custom') continue;
      if (k === 'icon_custom_color' && v.icon_color !== 'custom') continue;
      if (k === 'slider_custom_color' && v.slider_colour !== 'custom') continue;
      if (/^colour_[123]$/.test(k) && +k.slice(-1) > +(v.colour_count || 0)) continue;
      if (k === 'picture_url' && v.picture !== 'custom') continue;
      if (k === 'on_lights') continue;
      if (k === 'on_brightness_pct' && v.on_brightness !== 'fixed') continue;
      if (k === 'tap_page' && v.tap !== 'page') continue;
      if (k === 'hold_page' && v.hold !== 'page') continue;
      out[k] = val;
    }
    return out;
  }
  _emit(cfg) {
    this._config = cfg; this._render();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
  }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) {                                   // drop this card's own style changes
      const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k];
      return this._emit(cfg);
    }
    const clean = this._clean(v), inherited = this._inherited();
    const cfg = { type };
    for (const k of ROOM_KEYS) if (k !== 'type' && k in clean && !(k in DEFAULTS && same(clean[k], DEFAULTS[k]))) cfg[k] = clean[k];
    if (this._all) {
      const shared = {};
      for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !(k in DEFAULTS && same(val, DEFAULTS[k]))) shared[k] = val;
      const before = (Shared.data || {}).room_lights || {};
      // keep any of this card's own changes that weren't touched now
      for (const k of this._ownStyleKeys()) if (same(clean[k], this._lastShown?.[k])) cfg[k] = this._config[k];
      for (const k of Object.keys(clean)) if (!ROOM_KEYS.includes(k) && !same(clean[k], this._lastShown?.[k])) delete cfg[k];
      if (!same(shared, before)) {
        Shared.data = { ...(Shared.data || {}), room_lights: shared };
        clearTimeout(this._saveT);
        this._saveT = setTimeout(() => Shared.save(this._hass, 'room_lights', shared).catch(e => { this._error = 'Couldn’t save the shared style: ' + (e?.message || e); this._render(); }), 500);
        Shared.listeners.forEach(fn => fn(Shared.data));
      }
    } else {
      for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !same(val, inherited[k])) cfg[k] = val;
    }
    this._emit(cfg);
  }
  _render() {
    if (!this._config) return;
    if (!this._form) {
      this._note = document.createElement('div');
      this._note.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;background:rgba(var(--rgb-primary-color,3,169,244),.12)';
      this.appendChild(this._note);
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.title ?? s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => { ev.stopPropagation(); this._onChange(ev.detail.value); });
      this.appendChild(this._form);
    }
    const inherited = this._inherited(), own = this._ownStyleKeys();
    const room = Object.fromEntries(Object.entries(this._config).filter(([k]) => ROOM_KEYS.includes(k)));
    const data = this._all ? { ...inherited, ...room } : { ...inherited, ...this._config };
    data.edit_all = !!this._all; data.reset_style = false;
    this._lastShown = data;
    this._note.textContent = this._error || (this._all
      ? 'Master edit is on: look and rule changes apply to every Room Lights card. Room, title, icon and lights still apply to this card only.'
      : own.length ? `This card has ${own.length} setting${own.length > 1 ? 's' : ''} of its own; everything else follows the shared style.` : 'This card follows the shared style. Turn on Master edit to change every Room Lights card at once.');
    const top = [{ name: 'edit_all', selector: { boolean: {} } }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: { boolean: {} } }] : [])];
    this._form.hass = this._hass;
    this._form.schema = [...top, ...schema(data)];
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopRoomLightsCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopRoomLightsCardEditor);
if (!customElements.get(POPUP_TAG)) customElements.define(POPUP_TAG, OneStopRoomLightsPopup);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Room Lights card', description: 'A room’s lights in one card: On/Off, brightness, white light, colour and every light in a pop-up.', preview: true });
console.info(`%c ONE STOP %c Room Lights card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopRoomLights = { roomLights, kelvinToRgb, DEFAULTS, VERSION, Shared };
})();

/*!
 * One Stop – Shades card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Six layouts (3 compact, 3 tablet), all set from the visual card editor.
 */
(() => {
'use strict';
const VERSION = '1.3.1';
const TAG = 'one-stop-shades-card';
const EDITOR_TAG = TAG + '-editor';

const LAYOUTS = {
  bar: 'Slim bar', bar_line: 'Slim bar · Position line', bar_fill: 'Slim bar · Filled', bar_pill: 'Slim bar · One-piece buttons', slide: 'Compact · Swipe card', tile: 'Compact · Tile',
  window: 'Tablet · Window', panel: 'Tablet · Control panel', columns: 'Tablet · Shade columns',
};
const DEFAULTS = {
  layout: 'bar', show_climate: true, show_presets: true, show_schedule: true, show_individual: true, show_stop: true,
  preset_1: 25, preset_2: 50, preset_3: 75, open_word: 'Open', close_word: 'Close',
  corners: 'rounded', fill_color: [36, 111, 168], card_spacing: 'standard', size: 'large',
};
const ROOM_KEYS = ['type', 'area', 'name', 'room_icon', 'layout', 'master_shade', 'extra_shades', 'hide_shades', 'temperature_sensor', 'humidity_sensor', 'schedule_automations'];
const SKIP_CLASSES = ['garage', 'door', 'gate', 'damper'];
const shortName = (hass, id, area) => {
  let n = nameOf(hass, id); const a = hass.areas?.[area]?.name;
  if (a) { const re = new RegExp('^' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[-–:]?\\s*', 'i'); const t = n.replace(re, ''); if (t) n = t; }
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const titleCase = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const isGroup = st => Array.isArray(st?.attributes?.entity_id);
const posOf = st => { if (!st) return null; const p = st.attributes?.current_position; if (Number.isFinite(p)) return p; return st.state === 'open' ? 100 : st.state === 'closed' ? 0 : null; };
const areaOf = (hass, id) => { const e = hass.entities?.[id]; return e?.area_id || hass.devices?.[e?.device_id]?.area_id || null; };
const nameOf = (hass, id) => (hass.states[id]?.attributes?.friendly_name || id).trim();
const stateWord = (st, cfg) => {
  if (!live(st)) return 'Not responding';
  if (st.state === 'opening') return 'Opening…'; if (st.state === 'closing') return 'Closing…';
  const p = posOf(st); if (p == null) return titleCase(st.state);
  return p === 0 ? 'Closed' : p === 100 ? 'Open' : `${p}% open`;
};
const fmtTime = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ''); if (!m) return s; let h = +m[1]; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m[2]} ${ap}`; };

function roomShades(hass, cfg) {
  const hide = new Set(cfg.hide_shades || []), out = new Set();
  if (cfg.area) for (const id of Object.keys(hass.states)) {
    if (!id.startsWith('cover.')) continue;
    const st = hass.states[id];
    if (isGroup(st) || SKIP_CLASSES.includes(st.attributes?.device_class)) continue;
    if (hass.entities?.[id]?.entity_category) continue;
    if (areaOf(hass, id) === cfg.area) out.add(id);
  }
  for (const id of cfg.extra_shades || []) if (hass.states[id]) out.add(id);
  for (const id of hide) out.delete(id);
  return [...out].sort((a, b) => nameOf(hass, a).localeCompare(nameOf(hass, b)));
}
function masterShade(hass, cfg, shades) {
  if (cfg.master_shade && hass.states[cfg.master_shade]) return cfg.master_shade;
  const g = Object.keys(hass.states).find(id => id.startsWith('cover.') && isGroup(hass.states[id]) && areaOf(hass, id) === cfg.area);
  return g || null;
}
function sensorFor(hass, cfg, cls) {
  const key = cls === 'temperature' ? 'temperature_sensor' : 'humidity_sensor';
  if (cfg[key]) return hass.states[cfg[key]] ? cfg[key] : null;
  const found = Object.keys(hass.states).filter(id => id.startsWith('sensor.') && hass.states[id].attributes?.device_class === cls && areaOf(hass, id) === cfg.area && live(hass.states[id]));
  return found.sort((a, b) => (/weather|room|ambient/.test(b) - /weather|room|ambient/.test(a)))[0] || null;
}

/* ---------------- schedule: read open/close times from automations ---------------- */
const Schedules = {
  cache: null, loading: null,
  load(hass) {
    if (this.cache) return Promise.resolve(this.cache);
    if (!this.loading) this.loading = (async () => {
      const autos = Object.values(hass.states).filter(s => s.entity_id.startsWith('automation.') && s.attributes?.id);
      const out = [];
      await Promise.all(autos.map(async a => {
        try { const cfg = await hass.callApi('GET', 'config/automation/config/' + a.attributes.id); if (/cover\./.test(JSON.stringify(cfg))) out.push({ entity: a.entity_id, cfg }); } catch (e) { /* not an admin, or not editable */ }
      }));
      this.cache = out; return out;
    })();
    return this.loading;
  },
};
function describeTrigger(hass, t) {
  const kind = t.trigger || t.platform;
  const days = Array.isArray(t.weekday) ? t.weekday : t.weekday ? [t.weekday] : null;
  const dayWord = !days ? 'Every day' : same([...days].sort(), ['fri', 'mon', 'thu', 'tue', 'wed']) ? 'Weekdays' : same([...days].sort(), ['sat', 'sun']) ? 'Weekends' : days.map(d => titleCase(d)).join(', ');
  if (kind === 'time') {
    const at = Array.isArray(t.at) ? t.at[0] : t.at;
    let when = at;
    if (typeof at === 'string' && at.includes('.')) { const st = hass.states[at]; when = st ? (st.attributes?.has_time === false ? null : st.state.split(' ').pop()) : null; }
    if (!when) return null;
    return { sort: when, when: fmtTime(when), days: dayWord };
  }
  if (kind === 'sun') {
    const ev = t.event === 'sunrise' ? 'Sunrise' : 'Sunset';
    let off = t.offset || ''; if (typeof off === 'object') off = `${off.hours ? off.hours + 'h' : ''}${off.minutes ? off.minutes + 'm' : ''}`;
    return { sort: ev === 'Sunrise' ? '06:00' : '19:00', when: ev + (off && off !== '0' && off !== '00:00:00' ? ` ${off}` : ''), days: dayWord };
  }
  if (kind === 'sun.sunset' || kind === 'sun.sunrise') return { sort: kind.endsWith('rise') ? '06:00' : '19:00', when: kind.endsWith('rise') ? 'Sunrise' : 'Sunset', days: dayWord };
  return null;
}
function scheduleFor(hass, cfg, coverIds, deviceIds, shadeIds) {
  if (!Schedules.cache) return null;
  const wanted = cfg.schedule_automations?.length ? new Set(cfg.schedule_automations) : null;
  const floor = hass.areas?.[cfg.area]?.floor_id;
  const rows = [];
  const who = step => {   // which of this room's shades an action moves (null = none)
    const t = { ...(step.target || {}), ...(step.data || {}) };
    const ents = [].concat(t.entity_id || []), devs = [].concat(t.device_id || []), areas = [].concat(t.area_id || []), floors = [].concat(t.floor_id || []);
    if ((cfg.area && areas.includes(cfg.area)) || (floor && floors.includes(floor))) return 'all';
    const hit = shadeIds.filter(id => ents.includes(id) || devs.includes(hass.entities?.[id]?.device_id));
    if (ents.some(e => coverIds.has(e) && !shadeIds.includes(e))) return 'all';      // the room's shade group
    return hit.length ? (hit.length === shadeIds.length ? 'all' : hit) : null;
  };
  const what = step => {
    const svc = step.action || step.service || '';
    if (svc === 'cover.open_cover') return 'Open'; if (svc === 'cover.close_cover') return 'Close';
    if (svc === 'cover.set_cover_position') { const p = step.data?.position; return p === 0 ? 'Close' : p === 100 ? 'Open' : `${p}%`; }
    return null;
  };
  for (const { entity, cfg: a } of Schedules.cache) {
    if (wanted && !wanted.has(entity)) continue;
    const triggers = [].concat(a.triggers || a.trigger || []);
    const enabled = hass.states[entity]?.state === 'on';
    const byId = {}; triggers.forEach((t, i) => { const d = describeTrigger(hass, t); if (d) byId[t.id ?? '#' + i] = d; });
    if (!Object.keys(byId).length) continue;
    const walk = (steps, ids) => {
      for (const s of [].concat(steps || [])) {
        if (!s || typeof s !== 'object') continue;
        if (s.choose) for (const opt of [].concat(s.choose)) { const cond = [].concat(opt.conditions || []).find(c => c.condition === 'trigger'); walk(opt.sequence, cond ? [].concat(cond.id) : ids); }
        for (const k of ['default', 'parallel', 'sequence', 'then', 'else']) if (s[k]) walk(s[k], ids);
        const w = what(s), target = w && who(s);
        if (target) for (const id of (ids || Object.keys(byId))) if (byId[id]) rows.push({ ...byId[id], what: w, target, enabled, automation: entity });
      }
    };
    walk(a.actions || a.action, null);
  }
  // one line per time: "Blackout shades open · Zebra shades 4%"
  const label = r => r.target === 'all' ? (r.what === 'Open' || r.what === 'Close' ? r.what : `Move to ${r.what}`)
    : r.target.map(id => nameOf(hass, id).replace(/^.*? - /, '')).join(' & ') + ' ' + (r.what === 'Open' ? 'open' : r.what === 'Close' ? 'close' : r.what);
  const byTime = new Map();
  for (const r of rows) {
    const k = r.when + '|' + r.days, cur = byTime.get(k) || { ...r, parts: [], kinds: new Set() };
    const l = label(r); if (!cur.parts.includes(l)) cur.parts.push(l); cur.kinds.add(r.what === 'Close' ? 'close' : 'open'); cur.enabled = cur.enabled || r.enabled;
    byTime.set(k, cur);
  }
  let out = [...byTime.values()];
  // same actions on weekdays and weekends -> every day
  const merged = [];
  for (const r of out) {
    const twin = out.find(x => x !== r && x.when === r.when && same(x.parts, r.parts) && [x.days, r.days].sort().join() === 'Weekdays,Weekends');
    if (twin) { if (r.days === 'Weekdays') merged.push({ ...r, days: 'Every day' }); continue; }
    merged.push(r);
  }
  return merged.map(r => ({ ...r, text: r.parts.join(' · '), what: r.kinds.has('close') && !r.kinds.has('open') ? 'Close' : 'Open' })).sort((a, b) => a.sort.localeCompare(b.sort));
}

/* ---------------- shared house style (master edit) ---------------- */
const STYLE_DASH = 'one-stop-cards', SECTION = 'shades';
const Shared = {
  data: null, loading: null, listeners: new Set(), subscribed: false,
  _cache() { try { localStorage.setItem('one-stop-cards-style', JSON.stringify(this.data || {})); } catch (e) {} },
  _readCache() { if (!this.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) this.data = c; } catch (e) {} } },
  get(hass) {
    this._readCache();
    if (!this.loading) this.loading = (async () => {
      let d = {}; try { d = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      const changed = !same(d, this.data); this.data = d; this._cache(); this._subscribe(hass); if (changed) this.listeners.forEach(fn => fn(d)); return d;
    })();
    return this.loading;
  },
  _subscribe(hass) {
    if (this.subscribed || !hass?.connection) return; this.subscribed = true;
    hass.connection.subscribeEvents(async ev => {
      if (ev?.data?.url_path !== STYLE_DASH) return;
      try { this.data = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      this._cache(); this.listeners.forEach(fn => fn(this.data));
    }, 'lovelace_updated').catch(() => {});
  },
  async save(hass, values) {
    const list = await hass.callWS({ type: 'lovelace/dashboards/list' });
    if (!list.some(d => d.url_path === STYLE_DASH))
      await hass.callWS({ type: 'lovelace/dashboards/create', url_path: STYLE_DASH, title: 'One Stop Cards', icon: 'mdi:palette-swatch-outline', show_in_sidebar: false, require_admin: false, mode: 'storage' });
    let cfg; try { cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); } catch (e) { cfg = null; }
    cfg = cfg && cfg.views ? cfg : { views: [{ title: 'One Stop Cards', cards: [{ type: 'markdown', content: '## One Stop Cards\nShared styles for One Stop cards.' }] }] };
    cfg.one_stop = { ...(cfg.one_stop || {}), [SECTION]: values };
    await hass.callWS({ type: 'lovelace/config/save', url_path: STYLE_DASH, config: cfg });
    this.data = cfg.one_stop; this._cache(); this.listeners.forEach(fn => fn(this.data));
  },
};

/* ---------------- icons (inline so nothing extra is needed) ---------------- */
const SHADE_CLOSED = 'M19 2H5a2 2 0 0 0-2 2v2h18V4a2 2 0 0 0-2-2M3 8v12h2V8H3m16 0v12h2V8h-2M7 8v12h10V8H7Z';

/* ---------------- styles ---------------- */
const CSS = `
:host{display:block;--fill:36,111,168}
ha-card{position:relative;overflow:hidden;box-sizing:border-box;padding:var(--pad,18px);border-radius:var(--radius,22px);color:#f7f9fc;font-family:Arial,Helvetica,sans-serif;container:oss/inline-size;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);user-select:none;-webkit-tap-highlight-color:transparent}
ha-card.open{border-color:rgba(var(--fill),.45)}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2px solid #fff;outline-offset:2px}
button:active{transform:scale(.96)} button[disabled]{opacity:.4;cursor:default}
.hide{display:none!important}
.head{display:flex;align-items:center;flex-wrap:wrap;gap:10px 12px;min-width:0}
.ricon{flex:none;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(var(--fill),.18)}
.ricon ha-icon{--mdc-icon-size:28px;color:rgb(var(--fill-light,120,180,230))}
.title{flex:1 1 120px;min-width:0}
.name{font-weight:650;letter-spacing:-.4px;font-size:21px;line-height:1.2;overflow-wrap:anywhere}
.sub{font-size:14px;line-height:18px;color:rgba(235,241,248,.78)}
.chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-left:auto}
.chip{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 10px;border-radius:999px;font-size:15px;font-weight:600;background:rgba(219,93,96,.24);border:1px solid rgba(219,93,96,.45)}
.chip.h{background:rgba(83,145,215,.26);border-color:rgba(83,145,215,.5)}
.chip ha-icon{--mdc-icon-size:18px}
/* generic sliders */
.hs{position:relative;height:var(--h,64px);border-radius:var(--r,18px);overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);cursor:ew-resize;touch-action:none}
.hs .f{position:absolute;inset:0 auto 0 0;width:var(--p,0%);background:rgb(var(--fill));opacity:.9;transition:width .15s}
.hs .l{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 16px;pointer-events:none;font-weight:600;font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.hs .l b{font-weight:650}
.vs{position:relative;width:100%;height:var(--vh,220px);border-radius:20px;overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);cursor:ns-resize;touch-action:none}
.vs .f{position:absolute;left:0;right:0;top:0;height:calc(100% - var(--p,0%));background:repeating-linear-gradient(180deg,rgba(220,228,238,.92) 0 14px,rgba(190,200,214,.92) 14px 16px);box-shadow:0 3px 8px rgba(0,0,0,.35);transition:height .15s}
.vs .l{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-weight:650;font-size:18px;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.moving .f{transition:none}
/* buttons */
.btns{display:grid;grid-template-columns:repeat(var(--n,3),1fr);gap:8px}
.btn{height:var(--bh,48px);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:650;font-size:16px;background:#334b65;border:1px solid #7796b5;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 5px rgba(0,0,0,.22)}
.btn ha-icon{--mdc-icon-size:22px}
.btn.ghost{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16)}
.presets{display:grid;grid-template-columns:repeat(var(--pn,3),1fr);gap:8px}
.presets .btn{height:40px;font-size:15px;background:rgba(var(--fill),.22);border-color:rgba(var(--fill),.55)}
.presets .btn.sel{background:rgba(var(--fill),.55)}
/* schedule */
.sched{display:flex;flex-direction:column;gap:6px}
.srow{display:flex;align-items:center;gap:10px;font-size:15px;line-height:19px}
.srow ha-icon{--mdc-icon-size:20px;opacity:.85}
.srow .w{font-weight:650;min-width:72px;white-space:nowrap}
.srow .d{opacity:.72;margin-left:auto;text-align:right;white-space:nowrap}
.srow>span:nth-child(3){flex:1;min-width:0}
.srow.off{opacity:.45}
.stitle{font-size:12px;font-weight:650;letter-spacing:.5px;text-transform:uppercase;opacity:.65}
.timeline{position:relative;height:34px;border-radius:10px;background:linear-gradient(90deg,rgba(20,30,60,.6),rgba(60,110,170,.35) 30%,rgba(120,170,220,.35) 50%,rgba(60,110,170,.35) 70%,rgba(20,30,60,.6));overflow:hidden}
.timeline .mk{position:absolute;top:4px;bottom:4px;width:4px;margin-left:-2px;border-radius:2px;background:#9fd0ff;box-shadow:0 0 6px rgba(160,210,255,.8)}
.timeline .hr{position:absolute;bottom:2px;font-size:10px;opacity:.6;transform:translateX(-50%)}
.timeline .mk.c{background:#ffb36b}
.timeline .tx{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:650;padding:2px 5px;border-radius:6px;background:rgba(0,0,0,.45);white-space:nowrap}
.timeline .now{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,80,80,.9)}
.empty{opacity:.7;font-size:14px}
/* ---- layout: bar ---- */
.L-bar .row1{display:flex;align-items:center;gap:10px}
.L-bar .mini{display:flex;gap:6px;flex:none}
.L-bar .mini .btn{width:48px;height:48px;padding:0}
.L-bar .more{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.L-bar .hs{--h:52px}

/* ---- slim bar family ---- */
.SB{position:relative;overflow:hidden}
.SB .row1{position:relative;z-index:1;display:flex;align-items:center;gap:10px}
.SB .title{cursor:pointer}
.SB .name{display:flex;align-items:center;gap:2px}
.SB .name>span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:normal;word-break:normal}
.SB .chev{flex:none;--mdc-icon-size:20px;opacity:.6;transition:transform .2s}
.SB.exp .chev{transform:rotate(180deg)}
.SB [data-nochev] .chev{display:none}
.SB .tmini{flex:none;text-align:right;align-self:center;font-size:13px;line-height:16px;color:rgba(235,241,248,.85);white-space:nowrap}
.SB .tmini b{display:block;font-size:15px;font-weight:650;color:#f7f9fc}
.SB .mini{display:flex;gap:6px;flex:none}
.SB .mini .btn{width:46px;height:46px;padding:0}
.SB .more{position:relative;z-index:1;margin-top:12px;display:flex;flex-direction:column;gap:8px}
.SB .more .hs{--h:52px}
.L-bar_line .pline{position:absolute;left:0;bottom:0;height:5px;width:var(--p,0%);background:rgb(var(--fill));box-shadow:0 0 10px rgba(var(--fill),.8);transition:width .3s}
.L-bar_line .ptrack{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,.08)}
.L-bar_fill .bgfill{position:absolute;left:0;top:0;bottom:0;width:var(--p,0%);background:linear-gradient(90deg,rgba(var(--fill),.42),rgba(var(--fill),.62));transition:width .3s}
.L-bar_fill .mini .btn{background:rgba(0,0,0,.25);border-color:rgba(255,255,255,.25)}
.L-bar_pill .seg{flex:none;display:flex;align-items:stretch;height:46px;border-radius:999px;overflow:hidden;background:#334b65;border:1px solid #7796b5;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 5px rgba(0,0,0,.22)}
.L-bar_pill .seg button{display:flex;align-items:center;justify-content:center;width:46px}
.L-bar_pill .seg button ha-icon{--mdc-icon-size:22px}
.L-bar_pill .seg .mid{width:auto;min-width:62px;padding:0 6px;font-weight:700;font-size:16px;border-left:1px solid rgba(255,255,255,.18);border-right:1px solid rgba(255,255,255,.18);background:linear-gradient(90deg,rgba(var(--fill),.55) var(--p,0%),transparent var(--p,0%))}
@container oss (max-width:420px){.SB.S-standard{--u:.85}.SB.S-large{--u:1.2}.SB.S-extra_large{--u:1.4}}
@container oss (max-width:330px){.SB .tmini span{display:none}}

/* ---- slim bar sizes (scale everything from one variable) ---- */
.SB{--u:1}
.SB.S-standard{--u:1}.SB.S-large{--u:1.35}.SB.S-extra_large{--u:1.7}
.SB.S-large,.SB.S-extra_large{padding:calc(var(--pad,18px) * 1.15)}
.SB .row1{gap:calc(10px * var(--u))}
.SB .ricon{width:calc(44px * var(--u));height:calc(44px * var(--u));border-radius:calc(14px * var(--u))}
.SB .ricon ha-icon{--mdc-icon-size:calc(28px * var(--u))}
.SB .name{font-size:calc(21px * var(--u))}
.SB .sub{font-size:calc(14px * var(--u));line-height:1.3}
.SB .chev{--mdc-icon-size:calc(20px * var(--u))}
.SB .tmini{font-size:calc(13px * var(--u));line-height:1.25}
.SB .tmini b{font-size:calc(15px * var(--u))}
.SB .mini{gap:calc(6px * var(--u))}
.SB .mini .btn{width:calc(46px * var(--u));height:calc(46px * var(--u));border-radius:calc(16px * var(--u))}
.SB .mini .btn ha-icon{--mdc-icon-size:calc(22px * var(--u))}
.SB .more{margin-top:calc(12px * var(--u));gap:calc(8px * var(--u))}
.SB .more .hs{--h:calc(52px * var(--u));--r:calc(16px * var(--u))}
.SB .more .hs .l{font-size:calc(16px * var(--u))}
.L-bar_pill .seg{height:calc(46px * var(--u))}
.L-bar_pill .seg button{width:calc(46px * var(--u))}
.L-bar_pill .seg button ha-icon{--mdc-icon-size:calc(22px * var(--u))}
.L-bar_pill .seg .mid{min-width:calc(62px * var(--u));font-size:calc(16px * var(--u))}
.L-bar_line .pline,.L-bar_line .ptrack{height:calc(5px * var(--u))}

/* Large / Extra large: name + temperature on top, big full-width buttons underneath */
.SB .bigs{position:relative;z-index:1;margin-top:calc(12px * var(--u))}
.SB .bigs .hs{--h:calc(54px * var(--u));--r:calc(18px * var(--u))}
.SB .bigs .hs .l{font-size:calc(17px * var(--u))}
.SB.S-standard .bigs{display:none}
.SB.S-large .row1,.SB.S-extra_large .row1{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"i t m" "b b b";row-gap:calc(12px * var(--u))}
.SB.S-large .ricon,.SB.S-extra_large .ricon{grid-area:i}
.SB.S-large .title,.SB.S-extra_large .title{grid-area:t}
.SB.S-large .tmini,.SB.S-extra_large .tmini{grid-area:m}
.SB.S-large .mini,.SB.S-extra_large .mini,.SB.S-large .seg,.SB.S-extra_large .seg{grid-area:b;width:100%}
.SB.S-large .mini,.SB.S-extra_large .mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:calc(8px * var(--u))}
.SB.S-large .mini .btn,.SB.S-extra_large .mini .btn{width:auto;height:calc(70px * var(--u));border-radius:calc(14px * var(--u))}
.SB.S-large .mini .btn ha-icon,.SB.S-extra_large .mini .btn ha-icon{--mdc-icon-size:calc(30px * var(--u))}
.SB.S-large .seg,.SB.S-extra_large .seg{height:calc(70px * var(--u))}
.SB.S-large .seg button ha-icon,.SB.S-extra_large .seg button ha-icon{--mdc-icon-size:calc(30px * var(--u))}
.SB.S-large .seg .mid,.SB.S-extra_large .seg .mid{font-size:calc(20px * var(--u))}
.SB.S-large .seg button,.SB.S-extra_large .seg button{flex:1}
.SB.S-large .seg .mid,.SB.S-extra_large .seg .mid{flex:1.2}
/* ---- layout: slide ---- */
.L-slide{padding:0!important}
.L-slide .big{--h:100%;position:relative;border-radius:inherit;border:0;min-height:132px;background:transparent}
.L-slide .big .f{opacity:.55}
.L-slide .over{position:absolute;inset:0;padding:var(--pad,18px);display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
.L-slide .over .head,.L-slide .over .dots{pointer-events:auto}
.L-slide .pct{font-size:34px;font-weight:700;letter-spacing:-1px}
.L-slide .dots{display:flex;gap:8px;align-items:center}
.L-slide .dot{height:34px;padding:0 12px;border-radius:999px;font-size:14px;font-weight:650;display:flex;align-items:center;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.22)}
.L-slide .drawer{padding:0 var(--pad,18px) var(--pad,18px);display:flex;flex-direction:column;gap:8px}
/* ---- layout: tile ---- */
.L-tile .tilegrid{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:10px}
.L-tile .pct{font-size:46px;font-weight:700;letter-spacing:-1.5px;line-height:1}
.L-tile .pct small{font-size:16px;font-weight:600;opacity:.75;letter-spacing:0;display:block;margin-top:4px}
.L-tile .ud{display:flex;flex-direction:column;gap:8px}
.L-tile .ud .btn{width:64px;height:52px}
.L-tile .glass{height:12px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:12px}
.L-tile .glass i{display:block;height:100%;width:var(--p,0%);background:rgb(var(--fill));transition:width .2s}
.L-tile .list{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.L-tile .hs{--h:46px}
/* ---- layout: window ---- */
.L-window .wgrid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;margin-top:14px}
@container oss (max-width:560px){.L-window .wgrid{grid-template-columns:1fr}}
.L-window .frame{position:relative;border-radius:18px;padding:12px;background:linear-gradient(#3a4656,#2b3542);box-shadow:inset 0 0 0 3px rgba(255,255,255,.18)}
.L-window .panes{display:grid;grid-template-columns:repeat(var(--panes,1),1fr);gap:10px}
.L-window .pane{position:relative;border-radius:10px;overflow:hidden;height:250px;background:linear-gradient(#8fc3ee,#cfe6f7 55%,#9ccb8a 56%,#7fb06e);cursor:ns-resize;touch-action:none}
.L-window .pane .f{position:absolute;left:0;right:0;top:0;height:calc(100% - var(--p,0%));background:repeating-linear-gradient(180deg,#e9edf2 0 18px,#cfd6df 18px 20px);box-shadow:0 4px 10px rgba(0,0,0,.35);transition:height .2s}
.L-window .pane .f::after{content:'';position:absolute;left:50%;bottom:-14px;width:4px;height:14px;margin-left:-2px;background:#cfd6df}
.L-window .pane .cap{position:absolute;left:8px;right:8px;bottom:8px;text-align:center;font-size:13px;font-weight:650;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);pointer-events:none}
.L-window .moving .f{transition:none}
.L-window .side{display:flex;flex-direction:column;gap:14px}
.L-window .big{font-size:52px;font-weight:700;letter-spacing:-1.5px;line-height:1}
/* ---- layout: panel ---- */
.L-panel .body{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.L-panel .hs.master{--h:80px;--r:22px}
.L-panel .hs.master .l{font-size:18px}
.L-panel .sect{display:flex;flex-direction:column;gap:8px;padding-top:4px}
/* ---- layout: columns ---- */
.L-columns .cgrid{display:grid;grid-template-columns:minmax(200px,.9fr) minmax(0,1.6fr);gap:18px;margin-top:14px}
@container oss (max-width:560px){.L-columns .cgrid{grid-template-columns:1fr}}
.L-columns .gauge{position:relative;aspect-ratio:1;max-width:240px;width:100%;margin:0 auto;border-radius:50%;background:conic-gradient(rgb(var(--fill)) var(--deg,0deg),rgba(255,255,255,.09) 0);display:flex;align-items:center;justify-content:center;transition:background .2s}
.L-columns .gauge::before{content:'';position:absolute;inset:16px;border-radius:50%;background:rgba(20,24,30,.92)}
.L-columns .gauge .in{position:relative;text-align:center}
.L-columns .gauge .in b{display:block;font-size:44px;letter-spacing:-1px}
.L-columns .gauge .in span{font-size:14px;opacity:.75}
.L-columns .cols{display:grid;grid-template-columns:repeat(var(--cn,2),minmax(0,1fr));gap:12px}
.L-columns .col{display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:0}
.L-columns .col .cn{font-size:14px;font-weight:600;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.L-columns .left{display:flex;flex-direction:column;gap:12px}
@container oss (max-width:380px){
  .chips{width:100%;justify-content:flex-start;margin-left:0}
  .srow{flex-wrap:wrap;row-gap:0}.srow .d{width:100%;margin-left:30px;text-align:left;font-size:13px}
  .name{font-size:19px}.L-tile .pct{font-size:40px}.btn{font-size:15px}.btn ha-icon{--mdc-icon-size:20px}
  .btns .btn span{display:none}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ---------------- the card ---------------- */
class OneStopShadesCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const covers = Object.keys(hass?.states || {}).filter(id => id.startsWith('cover.') && !SKIP_CLASSES.includes(hass.states[id].attributes?.device_class));
    const a = covers.map(id => areaOf(hass, id)).find(Boolean);
    return a ? { area: a } : {};
  }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = { ...config }; this._merge();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._built = false; this._expanded = this._expanded || false;
    if (this._hass) this._render();
  }
  _merge() { Shared._readCache(); this._cfg = { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}), ...this._raw }; }
  connectedCallback() {
    this._onShared = () => { const b = JSON.stringify(this._cfg); this._merge(); if (JSON.stringify(this._cfg) === b && this._built) return; this._built = false; if (this._hass) this._render(); };
    Shared.listeners.add(this._onShared);
  }
  disconnectedCallback() { Shared.listeners.delete(this._onShared); }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first) { Shared.get(hass); if (this._cfg.show_schedule) Schedules.load(hass).then(() => this._update()); }
    if (!this._built) this._render(); else this._update();
  }
  getCardSize() { return /^bar|slide|tile/.test(this._cfg?.layout || '') ? 2 : 7; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }

  _areaName() { return this._hass?.areas?.[this._cfg.area]?.name || titleCase(this._cfg.area); }
  _title() { return this._cfg.name || this._areaName(); }
  _model() {
    const h = this._hass, c = this._cfg;
    const shades = roomShades(h, c), master = masterShade(h, c, shades);
    const targets = master ? [master] : shades;
    const positions = shades.map(id => posOf(h.states[id])).filter(p => p != null);
    const mpos = master ? posOf(h.states[master]) : positions.length ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length) : null;
    const moving = [master, ...shades].some(id => ['opening', 'closing'].includes(h.states[id]?.state));
    const devs = new Set([master, ...shades].map(id => h.entities?.[id]?.device_id).filter(Boolean));
    const covers = new Set([master, ...shades].filter(Boolean));
    for (const id of [master].filter(Boolean)) for (const m of h.states[id]?.attributes?.entity_id || []) covers.add(m);
    return { shades, master, targets, mpos, moving, temp: sensorFor(h, c, 'temperature'), hum: sensorFor(h, c, 'humidity'), covers, devs };
  }

  /* ---- shared building blocks ---- */
  _chips(m) {
    if (!this._cfg.show_climate) return '';
    const h = this._hass, out = [];
    const fmt = (id, unit) => { const st = h.states[id]; if (!live(st)) return '—'; const v = parseFloat(st.state); return Number.isFinite(v) ? (Math.round(v * 10) / 10) + (unit || st.attributes.unit_of_measurement || '') : st.state; };
    if (m.temp) out.push(`<span class="chip" data-chip="t"><ha-icon icon="mdi:thermometer"></ha-icon><span>${esc(fmt(m.temp))}</span></span>`);
    if (m.hum) out.push(`<span class="chip h" data-chip="h"><ha-icon icon="mdi:water-percent"></ha-icon><span>${esc(fmt(m.hum, '%'))}</span></span>`);
    return out.length ? `<div class="chips">${out.join('')}</div>` : '';
  }
  _tmini(m) {
    if (!this._cfg.show_climate || (!m.temp && !m.hum)) return '';
    return `<div class="tmini">${m.temp ? '<b data-tm="t"></b>' : ''}${m.hum ? '<span data-tm="h"></span>' : ''}</div>`;
  }
  _head(m, sub = true, extra = '') {
    return `<div class="head"><div class="ricon"><ha-icon icon="${esc(this._cfg.room_icon || 'mdi:roller-shade')}"></ha-icon></div>
      <div class="title"><div class="name">${esc(this._title())}</div>${sub ? '<div class="sub" data-sub></div>' : ''}</div>${extra}${this._chips(m)}</div>`;
  }
  _hslider(id, label, cls = '') { return `<div class="hs ${cls}" data-slide="${esc(id)}" data-axis="x"><div class="f"></div><div class="l"><span>${esc(label)}</span><b data-pct></b></div></div>`; }
  _buttons(n = 3, ghost = false) {
    const c = this._cfg, parts = [`<button class="btn ${ghost ? 'ghost' : ''}" data-cmd="close"><ha-icon icon="mdi:window-shutter"></ha-icon><span>${esc(c.close_word)}</span></button>`];
    if (c.show_stop) parts.push(`<button class="btn ${ghost ? 'ghost' : ''}" data-cmd="stop"><ha-icon icon="mdi:stop-circle-outline"></ha-icon><span>Stop</span></button>`);
    parts.push(`<button class="btn ${ghost ? 'ghost' : ''}" data-cmd="open"><ha-icon icon="mdi:window-shutter-open"></ha-icon><span>${esc(c.open_word)}</span></button>`);
    return `<div class="btns" style="--n:${parts.length}">${parts.join('')}</div>`;
  }
  _presets() {
    const c = this._cfg; if (!c.show_presets) return '';
    const ps = [c.preset_1, c.preset_2, c.preset_3].map(Number).filter(v => Number.isFinite(v) && v > 0 && v < 100);
    return ps.length ? `<div class="presets" style="--pn:${ps.length}">${ps.map(v => `<button class="btn" data-preset="${v}">${v}%</button>`).join('')}</div>` : '';
  }
  _individual(m, kind = 'h') {
    if (!this._cfg.show_individual || m.shades.length < 2 && m.master == null) return '';
    if (!m.shades.length) return '';
    return m.shades.map(id => kind === 'v'
      ? `<div class="col"><div class="vs" data-slide="${esc(id)}" data-axis="y"><div class="f"></div><div class="l" data-pct></div></div><div class="cn">${esc(nameOf(this._hass, id))}</div></div>`
      : this._hslider(id, shortName(this._hass, id, this._cfg.area))).join('');
  }
  _sched() { return this._cfg.show_schedule ? `<div class="sect" data-sched></div>` : ''; }

  _render() {
    const c = this._cfg, R = this.shadowRoot;
    if (!c.area && !c.master_shade && !(c.extra_shades || []).length) { R.innerHTML = `<style>${CSS}</style><ha-card style="padding:16px">Pick a room in the card editor.</ha-card>`; return; }
    const m = this._model();
    const fill = okRgb(c.fill_color) ? c.fill_color : DEFAULTS.fill_color;
    const vars = [`--fill:${fill.join(',')}`, `--fill-light:${fill.map(v => Math.min(255, v + 90)).join(',')}`,
      `--radius:${{ square: '8px', rounded: '22px', extra_round: '32px' }[c.corners] || '22px'}`,
      `--pad:${{ compact: '12px', standard: '18px', roomy: '24px' }[c.card_spacing] || '18px'}`].join(';');
    const L = c.layout in LAYOUTS ? c.layout : 'bar';
    let body = '';
    if (L.startsWith('bar')) {
      const tm = this._tmini(m);
      const btns = L === 'bar_pill'
        ? `<div class="seg"><button data-cmd="close" aria-label="Close"><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="mid" data-cmd="stop" aria-label="Stop" data-pct></button><button data-cmd="open" aria-label="Open"><ha-icon icon="mdi:arrow-up"></ha-icon></button></div>`
        : `<div class="mini"><button class="btn" data-cmd="close" aria-label="Close"><ha-icon icon="mdi:arrow-down"></ha-icon></button>${c.show_stop ? '<button class="btn ghost" data-cmd="stop" aria-label="Stop"><ha-icon icon="mdi:stop"></ha-icon></button>' : ''}<button class="btn" data-cmd="open" aria-label="Open"><ha-icon icon="mdi:arrow-up"></ha-icon></button></div>`;
      const inner = m.shades.length > 1 && c.show_individual ? this._individual(m) : this._hslider(m.master || 'all', m.shades.length === 1 ? nameOf(this._hass, m.shades[0]) : 'All shades');
      body = `${L === 'bar_fill' ? '<div class="bgfill"></div>' : ''}${L === 'bar_line' ? '<div class="ptrack"></div><div class="pline"></div>' : ''}
        <div class="row1"><div class="ricon"><ha-icon icon="${esc(c.room_icon || 'mdi:roller-shade')}"></ha-icon></div>
        <div class="title" data-toggle role="button" aria-expanded="${this._expanded}" ${(c.size || 'large') !== 'standard' && !(m.shades.length > 1 && c.show_individual) && !c.show_presets && !c.show_schedule ? 'data-nochev' : ''}><div class="name"><span>${esc(this._title())}</span><ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></div><div class="sub" data-sub></div></div>
        ${tm}${btns}</div>
        <div class="bigs">${this._hslider(m.master || 'all', m.shades.length > 1 ? 'All shades' : 'Shade')}</div>
        <div class="more ${this._expanded ? '' : 'hide'}" data-more>${(c.size || 'large') === 'standard' ? inner : (m.shades.length > 1 && c.show_individual ? this._individual(m) : '')}${this._presets()}${this._sched()}</div>`;
    } else if (L === 'slide') {
      body = `<div class="hs big" data-slide="${esc(m.master || 'all')}" data-axis="x"><div class="f"></div></div>
        <div class="over">${this._head(m, false)}<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px"><div><div class="pct" data-pct></div><div class="sub" data-sub></div></div>
        <div class="dots">${c.show_presets ? [c.preset_1, c.preset_2, c.preset_3].map(Number).filter(v => v > 0 && v < 100).map(v => `<button class="dot" data-preset="${v}">${v}%</button>`).join('') : ''}<button class="dot" data-toggle aria-label="More"><ha-icon icon="mdi:chevron-down" style="--mdc-icon-size:20px"></ha-icon></button></div></div></div>`;
      body = `<div style="position:relative">${body}</div><div class="drawer ${this._expanded ? '' : 'hide'}" data-more style="padding-top:14px">${this._buttons(3, true)}${this._individual(m)}${this._sched()}</div>`;
    } else if (L === 'tile') {
      body = `${this._head(m, false)}<div class="tilegrid"><div class="pct" data-pct></div><div class="ud"><button class="btn" data-cmd="open" aria-label="Open"><ha-icon icon="mdi:chevron-up"></ha-icon></button><button class="btn" data-cmd="close" aria-label="Close"><ha-icon icon="mdi:chevron-down"></ha-icon></button></div></div>
        <div class="glass"><i data-bar></i></div><div class="sub" data-sub style="margin-top:6px"></div>
        ${this._presets() ? `<div style="margin-top:12px">${this._presets()}</div>` : ''}
        ${m.shades.length > 1 && c.show_individual ? `<button class="btn ghost" data-toggle style="width:100%;margin-top:10px;height:40px">Each shade</button><div class="list ${this._expanded ? '' : 'hide'}" data-more>${this._individual(m)}</div>` : ''}
        ${c.show_schedule ? `<div style="margin-top:12px">${this._sched()}</div>` : ''}`;
    } else if (L === 'window') {
      const panes = m.shades.length ? m.shades : [m.master || 'all'];
      body = `${this._head(m)}<div class="wgrid"><div class="frame"><div class="panes" style="--panes:${panes.length}">${panes.map(id => `<div class="pane" data-slide="${esc(id)}" data-axis="y"><div class="f"></div><div class="cap">${esc(panes.length > 1 ? nameOf(this._hass, id) : 'Drag the shade')}</div></div>`).join('')}</div></div>
        <div class="side"><div><div class="big" data-pct></div><div class="sub" data-sub></div></div>${this._buttons()}${this._presets()}${this._sched()}</div></div>`;
    } else if (L === 'panel') {
      body = `${this._head(m)}<div class="body">${this._hslider(m.master || 'all', m.shades.length > 1 ? 'All shades' : 'Shade', 'master')}${this._buttons()}${this._presets()}
        ${m.shades.length > 1 && c.show_individual ? `<div class="sect"><div class="stitle">Each shade</div>${this._individual(m)}</div>` : ''}${this._sched()}</div>`;
    } else if (L === 'columns') {
      const cols = m.shades.length ? m.shades : [m.master || 'all'];
      body = `${this._head(m)}<div class="cgrid"><div class="left"><div class="gauge" data-gauge><div class="in"><b data-pct></b><span data-sub></span></div></div>${this._buttons(3)}${this._presets()}</div>
        <div class="left"><div class="cols" style="--cn:${Math.min(cols.length, 4)}">${cols.map(id => `<div class="col"><div class="vs" data-slide="${esc(id)}" data-axis="y"><div class="f"></div><div class="l" data-pct-of="${esc(id)}"></div></div><div class="cn">${esc(cols.length > 1 ? nameOf(this._hass, id) : 'All shades')}</div></div>`).join('')}</div>${this._sched()}</div></div>`;
    }
    R.innerHTML = `<style>${CSS}</style><ha-card class="L-${L} ${L.startsWith('bar') ? 'SB S-' + (c.size || 'large') : ''} ${this._expanded ? 'exp' : ''}" style="${vars}">${body}</ha-card>`;
    this._wire();
    this._built = true;
    this._update();
  }

  _wire() {
    const R = this.shadowRoot;
    R.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._cmd(b.dataset.cmd); }));
    R.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._setPos('all', +b.dataset.preset); }));
    R.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._expanded = !this._expanded; R.querySelectorAll('[data-more]').forEach(x => x.classList.toggle('hide', !this._expanded)); R.querySelector('ha-card')?.classList.toggle('exp', this._expanded); b.setAttribute?.('aria-expanded', this._expanded); }));
    R.querySelectorAll('[data-slide]').forEach(el => this._drag(el));
  }
  _drag(el) {
    const id = el.dataset.slide, axis = el.dataset.axis;
    let active = false, val = null;
    const frac = e => { const r = el.getBoundingClientRect(); return axis === 'y' ? 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) : Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    const show = v => { el.style.setProperty('--p', v + '%'); const t = el.querySelector('[data-pct]') || this.shadowRoot.querySelector(`[data-pct-of="${window.CSS?.escape ? window.CSS.escape(id) : id}"]`); if (t) t.textContent = v + '%'; if (el.classList.contains('big')) { const p = this.shadowRoot.querySelector('.L-slide [data-pct]'); if (p) p.textContent = v + '%'; } };
    el.addEventListener('pointerdown', e => { if (el.classList.contains('dis')) return; active = true; el.setPointerCapture?.(e.pointerId); el.classList.add('moving'); el._drag = true; val = Math.round(frac(e) * 100); show(val); e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('pointermove', e => { if (!active) return; val = Math.round(frac(e) * 100); show(val); });
    const end = e => { if (!active) return; active = false; el.classList.remove('moving'); val = Math.round(frac(e) * 100); show(val); this._setPos(id, val); setTimeout(() => { el._drag = false; }, 2500); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => { active = false; el._drag = false; el.classList.remove('moving'); });
  }
  _ids(id) { const m = this._model(); return id === 'all' ? m.targets : [id]; }
  async _call(service, data) { try { await this._hass.callService('cover', service, data); } catch (e) { console.warn('One Stop Shades:', e?.message || e); } }
  _cmd(cmd) {
    const t = this._ids('all').filter(id => live(this._hass.states[id])); if (!t.length) return;
    this._call({ open: 'open_cover', close: 'close_cover', stop: 'stop_cover' }[cmd], { entity_id: t });
  }
  _setPos(id, v) {
    const t = this._ids(id).filter(x => live(this._hass.states[x])); if (!t.length) return;
    this._call('set_cover_position', { entity_id: t, position: Math.max(0, Math.min(100, Math.round(v))) });
  }

  _update() {
    const h = this._hass, R = this.shadowRoot; if (!h || !this._built) return;
    const m = this._model(), c = this._cfg;
    const card = R.querySelector('ha-card'); if (!card) return;
    card.classList.toggle('open', (m.mpos || 0) > 0);
    const mst = m.master ? h.states[m.master] : m.shades.length ? h.states[m.shades[0]] : null;
    const word = m.moving ? (h.states[m.master]?.state === 'closing' ? 'Closing…' : 'Opening…') : m.mpos == null ? '—' : m.mpos === 0 ? 'Closed' : m.mpos === 100 ? 'Open' : `${m.mpos}% open`;
    R.querySelectorAll('[data-sub]').forEach(e => { e.textContent = word; });
    for (const el of R.querySelectorAll('[data-slide]')) {
      if (el._drag) continue;
      const id = el.dataset.slide, p = id === 'all' ? m.mpos : posOf(h.states[id]);
      el.style.setProperty('--p', (p ?? 0) + '%');
      el.classList.toggle('dis', id !== 'all' && !live(h.states[id]));
      const t = el.querySelector('[data-pct]'); if (t) t.textContent = p == null ? '—' : p + '%';
      const t2 = R.querySelector(`[data-pct-of="${id}"]`); if (t2) t2.textContent = p == null ? '—' : p + '%';
    }
    const anyDrag = [...R.querySelectorAll('[data-slide]')].some(e => e._drag);
    if (!anyDrag) R.querySelectorAll('.big[data-pct], .pct[data-pct], .in [data-pct]').forEach(e => { e.textContent = m.mpos == null ? '—' : m.mpos + '%'; });
    card.style.setProperty('--p', (m.mpos || 0) + '%');
    R.querySelectorAll('.seg .mid[data-pct]').forEach(e => { e.textContent = m.moving ? '■' : m.mpos == null ? '—' : m.mpos + '%'; e.style.setProperty('--p', (m.mpos || 0) + '%'); });
    const tmT = R.querySelector('[data-tm=t]'), tmH = R.querySelector('[data-tm=h]');
    const fmt0 = (id, unit) => { const st = h.states[id]; if (!live(st)) return '—'; const v = parseFloat(st.state); return Number.isFinite(v) ? (Math.round(v * 10) / 10) + (unit || st.attributes.unit_of_measurement || '') : st.state; };
    if (tmT && m.temp) { const st = h.states[m.temp], v = parseFloat(st?.state); tmT.textContent = Number.isFinite(v) ? (Math.round(v * 10) / 10) + '°' : '—'; } if (tmH && m.hum) { const v = parseFloat(h.states[m.hum]?.state); tmH.textContent = Number.isFinite(v) ? Math.round(v) + '% RH' : '—'; }
    const gauge = R.querySelector('[data-gauge]'); if (gauge) gauge.style.setProperty('--deg', ((m.mpos || 0) * 3.6) + 'deg');
    const bar = R.querySelector('[data-bar]'); if (bar) bar.style.setProperty('--p', (m.mpos || 0) + '%');
    R.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('sel', +b.dataset.preset === m.mpos));
    const fmt = (id, unit) => { const st = h.states[id]; if (!live(st)) return '—'; const v = parseFloat(st.state); return Number.isFinite(v) ? (Math.round(v * 10) / 10) + (unit || st.attributes.unit_of_measurement || '') : st.state; };
    const tc = R.querySelector('[data-chip=t] span'); if (tc && m.temp) tc.textContent = fmt(m.temp);
    const hc = R.querySelector('[data-chip=h] span'); if (hc && m.hum) hc.textContent = fmt(m.hum, '%');
    const cmdOk = m.targets.some(id => live(h.states[id]));
    R.querySelectorAll('[data-cmd]').forEach(b => { b.disabled = !cmdOk; });
    const sb = R.querySelector('[data-sched]');
    if (sb) {
      const rows = scheduleFor(h, c, m.covers, m.devs, m.shades);
      const key = JSON.stringify(rows);
      if (key !== sb._key) {
        sb._key = key;
        if (rows == null) sb.innerHTML = `<div class="stitle">Schedule</div><div class="empty">Loading…</div>`;
        else if (!rows.length) sb.innerHTML = `<div class="stitle">Schedule</div><div class="empty">No automatic open or close times found.</div>`;
        else {
          const toMin = s => { const mm = /(\d+):(\d+)/.exec(s); return mm ? (+mm[1]) * 60 + (+mm[2]) : null; };
          const marks = rows.map(r => ({ r, m: toMin(r.sort) })).filter(x => x.m != null);
          const now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
          const timeline = this._cfg.layout === 'panel' || this._cfg.layout === 'columns'
            ? `<div class="timeline">${marks.map(x => `<div class="mk ${x.r.what === 'Close' ? 'c' : ''}" style="left:${x.m / 14.4}%"></div>`).join('')}<div class="now" style="left:${nm / 14.4}%"></div>${[6, 12, 18].map(h => `<span class="hr" style="left:${h / .24}%">${h === 12 ? '12 PM' : h < 12 ? h + ' AM' : (h - 12) + ' PM'}</span>`).join('')}</div>` : '';
          sb.innerHTML = `<div class="stitle">Schedule</div>${timeline}${rows.slice(0, 6).map(r => `<div class="srow ${r.enabled ? '' : 'off'}"><ha-icon icon="${r.what === 'Close' ? 'mdi:window-shutter' : 'mdi:window-shutter-open'}"></ha-icon><span class="w">${esc(r.when)}</span><span>${esc(r.text)}</span><span class="d">${esc(r.days)}${r.enabled ? '' : ' · paused'}</span></div>`).join('')}`;
        }
      }
    }
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const pct = { number: { min: 5, max: 95, step: 5, mode: 'slider', unit_of_measurement: '%' } };
const schema = d => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  return [
    { name: 'area', selector: { area: {} } },
    grid([{ name: 'name', selector: { text: {} } }, { name: 'room_icon', selector: { icon: {} } }]),
    { name: 'layout', selector: sel(Object.entries(LAYOUTS).filter(([k]) => k.startsWith('bar') || k === d.layout)) },
    { name: 'size', selector: sel([['standard', 'Standard'], ['large', 'Large'], ['extra_large', 'Extra large']]) },
    section('g_shades', 'Which shades', 'mdi:roller-shade', [
      { name: 'master_shade', selector: { entity: { filter: { domain: 'cover' } } } },
      { name: 'extra_shades', selector: { entity: { multiple: true, filter: { domain: 'cover' } } } },
      { name: 'hide_shades', selector: { entity: { multiple: true, filter: { domain: 'cover' } } } },
    ]),
    section('g_show', 'What to show', 'mdi:eye-outline', [grid([
      { name: 'show_climate', selector: toggle }, { name: 'show_individual', selector: toggle },
      { name: 'show_presets', selector: toggle }, { name: 'show_stop', selector: toggle },
      { name: 'show_schedule', selector: toggle },
    ])]),
    section('g_climate', 'Temperature and humidity', 'mdi:thermometer', [
      { name: 'temperature_sensor', selector: { entity: { filter: { domain: 'sensor', device_class: 'temperature' } } } },
      { name: 'humidity_sensor', selector: { entity: { filter: { domain: 'sensor', device_class: 'humidity' } } } },
    ]),
    section('g_presets', 'Quick position buttons', 'mdi:format-list-numbered', [grid([
      { name: 'preset_1', selector: pct }, { name: 'preset_2', selector: pct }, { name: 'preset_3', selector: pct },
    ])]),
    section('g_schedule', 'Schedule', 'mdi:clock-outline', [
      { name: 'schedule_automations', selector: { entity: { multiple: true, filter: { domain: 'automation' } } } },
    ]),
    section('g_look', 'Look and words', 'mdi:palette-outline', [grid([
      { name: 'fill_color', selector: { color_rgb: {} } },
      { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
      { name: 'open_word', selector: { text: {} } }, { name: 'close_word', selector: { text: {} } },
    ])]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Shades cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  area: 'Room', name: 'Card title', room_icon: 'Room icon', layout: 'Layout', size: 'Size',
  master_shade: 'Main shade or shade group (controls them all)', extra_shades: 'Add shades from other rooms', hide_shades: 'Leave these shades out',
  show_climate: 'Temperature & humidity', show_individual: 'Each shade’s own slider', show_presets: 'Quick position buttons', show_stop: 'Stop button', show_schedule: 'Open / close times',
  temperature_sensor: 'Temperature sensor', humidity_sensor: 'Humidity sensor',
  preset_1: 'Button 1', preset_2: 'Button 2', preset_3: 'Button 3',
  schedule_automations: 'Only use these automations for the times',
  fill_color: 'Slider colour', corners: 'Card corners', card_spacing: 'Spacing inside the card', open_word: 'Open button words', close_word: 'Close button words',
};
const HELPERS = {
  name: 'Leave empty to use the room’s name.',
  master_shade: 'Leave empty to use the room’s shade group, or control each shade together.',
  temperature_sensor: 'Leave empty to pick one from the room automatically.',
  schedule_automations: 'Leave empty to find them automatically from your automations.',
};

class OneStopShadesCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) Shared.get(hass).then(() => this._render()); this._render(); }
  _inherited() { Shared._readCache(); return { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}) }; }
  _ownStyle() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _emit(cfg) { this._config = cfg; this._render(); this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true })); }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) { const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k]; return this._emit(cfg); }
    const clean = {};
    for (const [k, val] of Object.entries(v)) { if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null) continue; if (Array.isArray(val) && !val.length && !okRgb(val)) continue; clean[k] = val; }
    const inherited = this._inherited(), cfg = { type };
    for (const k of ROOM_KEYS) if (k !== 'type' && k in clean && !(k in DEFAULTS && same(clean[k], DEFAULTS[k]))) cfg[k] = clean[k];
    if (this._all) {
      const shared = {}; for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !(k in DEFAULTS && same(val, DEFAULTS[k]))) shared[k] = val;
      for (const k of this._ownStyle()) if (same(clean[k], this._shown?.[k])) cfg[k] = this._config[k];
      for (const k of Object.keys(clean)) if (!ROOM_KEYS.includes(k) && !same(clean[k], this._shown?.[k])) delete cfg[k];
      if (!same(shared, (Shared.data || {})[SECTION] || {})) {
        Shared.data = { ...(Shared.data || {}), [SECTION]: shared }; Shared.listeners.forEach(fn => fn(Shared.data));
        clearTimeout(this._t); this._t = setTimeout(() => Shared.save(this._hass, shared).catch(() => {}), 500);
      }
    } else for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !same(val, inherited[k])) cfg[k] = val;
    this._emit(cfg);
  }
  _render() {
    if (!this._config) return;
    if (!this._form) {
      this._note = document.createElement('div');
      this._note.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;background:rgba(var(--rgb-primary-color,3,169,244),.12)';
      this.appendChild(this._note);
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.title ?? s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => { ev.stopPropagation(); this._onChange(ev.detail.value); });
      this.appendChild(this._form);
    }
    const inh = this._inherited(), own = this._ownStyle();
    const room = Object.fromEntries(Object.entries(this._config).filter(([k]) => ROOM_KEYS.includes(k)));
    const data = this._all ? { ...inh, ...room } : { ...inh, ...this._config };
    data.edit_all = !!this._all; data.reset_style = false; this._shown = data;
    this._note.textContent = this._all ? 'Master edit is on: look changes apply to every Shades card. Room, layout and shades still apply to this card only.'
      : own.length ? `This card has ${own.length} setting${own.length > 1 ? 's' : ''} of its own.` : 'Turn on Master edit to change every Shades card at once.';
    this._form.hass = this._hass;
    this._form.schema = [{ name: 'edit_all', selector: toggle }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: toggle }] : []), ...schema(data)];
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopShadesCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopShadesCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Shades card', description: 'Shades for a room: slider, Open/Stop/Close, quick positions, each shade, temperature and the open/close schedule. Six layouts.', preview: true });
console.info(`%c ONE STOP %c Shades card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopShades = { roomShades, scheduleFor, Schedules, VERSION };
})();

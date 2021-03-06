import glob from 'glob';
import { ApolloServer, gql } from 'apollo-server-express';
import { ApolloError, AuthenticationError } from 'apollo-server-core';
import content, { roomDatabaseImages } from './loaders'
import { resolveImage, navItems, routes } from './loaders'
import fs from 'fs-extra';
import { minutes } from './minutes';
import path from 'path'
import {
  GraphQLDate,
  GraphQLTime,
  GraphQLDateTime
} from 'graphql-iso-date';

const uuidv4 = require('uuid/v4');

const typeDefs = gql`
scalar DateTime
type User{
  anonymous: Boolean
  current: Boolean
  crsid: String
  exec: Boolean
}
type Image{
  src: String
  srcSet: String
  placeholder: String
  alt: String
}
type Route{
  title: String
  url: String
}
type NavItem  {
  text: String
  icon : String
  url : String
  routes: [Route]
}
type Minutes{
  url: String
  type: String
  number: Int
  year: Int
  term: String
}
type TextCard{
  title: String
  icon: String
  description: String
}
type ImageCaptionCard{
  title: String
  image: Image
  description: String
  url: String
}
type HomePage {
  ecsuDoes: [TextCard]
  whatsHere: [ImageCaptionCard]
}
type WhatsOnEvent{
  title: String
  datetime: DateTime
  dtend: DateTime
  pubDate: DateTime
  allDay: Boolean
  category: String
  image: Image
  body: String
  url:String
}
type WhatsOnOpportunity{
  title: String
  datetime: String
  pubDate: DateTime
  allDay: Boolean
  category: String
  image: Image
  body: String
  url:String
}
type Exec{
  title: String
  crsid: [String]
  email: String
  name: String
  image: Image
  body: String
  url:String
  messagingUrl:String
}
type Society{
  title:String
  image:Image
  url: String
  body: String
}
type InfoPage{
  title: String
  subtitle: String
  image: Image
  body: String
  url: String
}
type Post{
  title: String
  subtitle: String
  image: Image
  description: String
  body: String
  url: String
  blog: Blog
}
type Blog{
  title: String
  description: String
  posts: [Post]
  url: String
}
type Comment{
  year: String
  body: String
  crsid: String
}
type Room{
  id: String!
  title:String
  grade: Int
  name: String
  hasImages: Boolean
  images: [Image]
  network: String
  basin: String
  livingRoom: String
  cudn: Boolean
  floor: String
  url: String
  comments: [Comment]
  location: RoomLocation
}
type RoomLocation{
  title: String
  image: Image
  url: String
  body: String
  rooms: [Room]
}
type Query {
  minutes: [Minutes]
  user: User
  routes: [Route]
  navItems: [NavItem]
  homePage: HomePage
  whatsOn(slug:String!): WhatsOnEvent
  whatsOnEvents: [WhatsOnEvent]
  opportunities(slug:String!): WhatsOnOpportunity
  whatsOnOpportunities: [WhatsOnOpportunity]
  exec(slug:String!): Exec
  execs: [Exec]
  society(slug:String!): Society
  societies: [Society]
  welfarePage(slug:String!): InfoPage
  welfarePages: [InfoPage]
  infoPage(slug:String!): InfoPage
  infoPages: [InfoPage]
  prospectivePage(slug:String!): InfoPage
  prospectivePages: [InfoPage]
  blog(slug: String!): Blog
  blogs: [Blog]
  post(slug:String!): Post
  rooms: [Room]
  roomLocations: [RoomLocation]
  roomLocation(slug:String!): RoomLocation
  room(slug:String!): Room
  covid: [WhatsOnOpportunity]
}    
type Mutation {
  roomPhotoUpload(roomSlug:String!, file: Upload!): Image
  minutesUpload(year:Int!, type:String!, term:String!, number:Int, file: Upload!): Minutes
  roomComment(roomSlug:String!, comment: String!, year: Int!): Comment
}
`;

// Resolvers define the technique for fetching the types in the
// schema. 
const resolvers = {
  DateTime: GraphQLDateTime,
  ImageCaptionCard: {
    image: obj => resolveImage(obj.image, obj.title)
  },
  HomePage: {
    ecsuDoes: obj => obj['ecsu_does'],
    whatsHere: obj => obj['whats_here'],
  },
  Exec: {
    image: obj => resolveImage(obj.image, obj.name),
    messagingUrl: obj => obj['messaging-url']
  },
  Society: {
    image: obj => resolveImage(obj.image, obj.title)
  },
  InfoPage: {},
  Post: {
    image: obj => resolveImage(obj.image, obj.title),
    blog: obj => content("blogs").then(result => result.find(x => x.title == obj.blog))
  },
  Blog: {
    posts: obj => content("posts").then(result => result.filter(x => x.blog == obj.title))
  },
  Comment: {
    year: obj => obj["Year"],
    body: obj => obj["Comment"],
  },
  Room: {
    comments: obj => content("room_comments").then(result => result.filter(x => x["Room"] === obj["Room"])),
    images: obj => roomDatabaseImages(obj),
    hasImages: obj => roomDatabaseImages(obj).length > 0,
    location: obj => content("room_locations").then(locations => locations.find(x => x.title === obj["Location"])),
    title: obj => obj['Title'],
    grade: obj => obj['Grade'] || null,
    name: obj => obj['Name'] || null,
    network: obj => obj['Network'] || null,
    basin: obj => obj['Basin'] || null,
    livingRoom: obj => obj['Living Room?'] || null,
    cudn: obj => obj['Cudn'] === false ? obj['Cudn'] : obj['Cudn'] || null,
    floor: obj => obj['Floor'] || null,
    url: obj => `/rooms/${obj['slug']}`
  },
  RoomLocation: {
    image: obj => resolveImage(obj.image, obj.title),
    rooms: obj => content("rooms").then(result => result.filter(x => x["Location"] == obj.title))
  },
  WhatsOnEvent: {
    image: obj => resolveImage(obj.image, obj.title),
    pubDate: obj => obj.pubdate
  },
  WhatsOnOpportunity: {
    image: obj => resolveImage(obj.image, obj.title),
    pubDate: obj => obj.pubdate
  },
  Query: {
    routes: obj => routes,
    navItems: (obj, args, context) => {
      var user = context.user;
      if (!(user.crsid)) {
        return navItems;
      } else {
        //COVID hack
        var out = [...navItems];
        out.splice(1, 0, {
          text: "Coronavirus",
          icon: "local_hospital",
          url: "/coronavirus/",
          routes: []
        });
        return out;
      }
    },
    minutes: obj => minutes(),
    homePage: obj => content("pages", "home"),
    whatsOn: (obj, args) => content("whatson", args.slug),
    whatsOnEvents: obj => content("whatson"),
    opportunities: (obj, args) => content("opportunities", args.slug),
    whatsOnOpportunities: obj => content("opportunities"),
    exec: (obj, args) => content("exec", args.slug),
    execs: obj => content("exec"),
    society: (obj, args) => content("societies", args.slug),
    societies: obj => content("societies"),
    welfarePage: (obj, args) => content("welfare", args.slug),
    welfarePages: obj => content("welfare"),
    infoPage: (obj, args) => content("info", args.slug),
    infoPages: obj => content("info"),
    prospectivePage: (obj, args) => content("prospective", args.slug),
    prospectivePages: obj => content("prospective"),
    blog: (obj, args) => content("blogs", args.slug),
    blogs: obj => content("blogs"),
    post: (obj, args) => content("posts", args.slug),
    roomLocations: obj => content("room_locations"),
    rooms: obj => content("rooms"),
    roomLocation: (obj, args) => content("room_locations", args.slug),
    room: (obj, args) => content("rooms", args.slug),
    covid: obj => content("covid"),
    user: (obj, args, context) => context.user
  },
  Mutation: {
    async minutesUpload(parent, args, context) {
      const { year, type, term, number } = args
      const { createReadStream, filename, mimetype, encoding } = await args.file;
      try {
        console.log("Upload: " + filename)
        await fs.mkdirp(`./user_uploads`);
        await fs.mkdirp(`./user_uploads/minutes`);
        await fs.mkdirp(`./user_uploads/minutes/${year}/`);
        const stream = createReadStream();
        const uploadDone = new Promise(fulfill => {
          stream.on("end", fulfill)
          stream.on("finish", fulfill)
          stream.on("error", fulfill)
        });
        stream.pipe(fs.createWriteStream(`./user_uploads/minutes/${year}/${filename.toLowerCase()}`))
        await fs.writeJSON(`./user_uploads/minutes/${year}/${filename.toLowerCase()}.json`, { year, type, term, number })
        await uploadDone;
      } catch (e) {
        console.error(e)
      }
      console.log("Upload done:" + filename)
      return {};
    },
    async roomComment(parent, args, context) {
      const { roomSlug, comment, year } = args
      var room = await content("rooms", roomSlug);
      var roomID = room.Room;
      var user = context.user;
      if (!(user.crsid)) throw new AuthenticationError(`Only authorised users allowed`);
      var slug = roomID+"-"+year;
      var message = {slug: slug, Room: roomID, Comment: comment, Year: year, crsid: user.crsid, uid: uuidv4()}
      try {
        await fs.mkdirp(`./user_uploads`);
        await fs.mkdirp(`./user_uploads/room_comments`);
        var os = fs.createWriteStream('./user_uploads/room_comments/toMod.csv', {flags:'a'});
        await os.write(JSON.stringify(message) + ",\n")
        os.close();
      } catch (e) {
        console.error(e)
        return null;
      }
      return message;
    }
  }
};

const server = new ApolloServer({
  uploads: {
    maxFileSize: 100000000000000
  },
  typeDefs, resolvers,
  context: ({ req }) => ({
    user: req.user ? { anonymous: false, ...req.user } : { anonymous: true }
  }),

});

export default function applyGraphqlMiddleware(app) {

  server.applyMiddleware({ app });
}
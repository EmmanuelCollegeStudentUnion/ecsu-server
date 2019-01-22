
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
import content from './content'
import { resolveImage } from './content'
import image from './image';

const typeDefs = gql`
    type Image{
      src: String
      srcSet: String
      placeholder: String
      alt: String
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
      datetime: String
      pubDate: String
      category: String
      image: Image
      body: String
      url:String
    }
    type Exec{
      title: String
      email: String
      name: String
      image: Image
      body: String
      url:String
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
    }
    type Room{
      title:String
      grade: Int
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
      homePage: HomePage
      whatsOn(slug:String!): WhatsOnEvent
      whatsOnEvents: [WhatsOnEvent]
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
      roomLocations: [RoomLocation]
      roomLocation(slug:String!): RoomLocation
      room(slug:String!): Room
    }
  `;

// Resolvers define the technique for fetching the types in the
// schema. 
const resolvers = {
  ImageCaptionCard: {
    image: obj => resolveImage(obj.image, obj.title)
  },
  HomePage: {
    ecsuDoes: obj => obj['ecsu_does'],
    whatsHere: obj => obj['whats_here'],
  },
  Exec: {
    image: obj => resolveImage(obj.image, obj.name)
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
  Comment: {},
  Room: {
    livingRoom: obj => obj['living_room'],
    comments: obj => content("room_comments").then(result => result.filter(x => x.title == obj.title)),
    images: obj => obj.images.map(x => resolveImage(x, obj.title)),
    location: obj => content("room_locations").then(locations => locations.find(x => x.title == obj.location))
  },
  RoomLocation: {
    image: obj => resolveImage(obj.image, obj.title),
    rooms: obj => content("rooms").then(result => result.filter(x => x.location == obj.title))
  },
  WhatsOnEvent: {
    image: obj => resolveImage(obj.image, obj.title),
    pubDate: obj => obj.pubdate.toString()
  },
  Query: {
    homePage: obj => content("pages", "home"),
    whatsOn: (obj, args) => content("whatson", args.slug),
    whatsOnEvents: obj => content("whatson"),
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
    roomLocation: (obj, args) => content("room_locations", args.slug),
    room: (obj, args) => content("rooms", args.slug),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });
app.get('/image/:folder/:file(*)', (req, res, next) => {
  res.type('image/png');
  const stream = image(`${req.params.folder}/${req.params.file}`, 0, 0, 0);
  stream.on('error', next).pipe(res);
})

app.listen({ port: 3254 }, () =>
  console.log(`🚀 Server ready at http://localhost:3254${server.graphqlPath}`)
);
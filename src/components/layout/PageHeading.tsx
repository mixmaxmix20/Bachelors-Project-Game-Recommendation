function PageHeading({ title }: { title: string }) {
  return (
    <h1 className="pt-6 text-center text-3xl font-bold sm:pt-10 sm:text-4xl">
      {title}
    </h1>
  );
}

export default PageHeading;
